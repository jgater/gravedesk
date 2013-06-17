# required modules

{tickethandler} = require "../lib"
{EventEmitter} = require "events" 
settings = require "../settings"
lang = require "../lang/english"
nodemailer = require "nodemailer"
contextio = require "contextio"
async = require "async"

# define smtp server transport
smtpServer = nodemailer.createTransport("SMTP", settings.smtp)

# define context IO client 
ctxioClient = new contextio.Client '2.0', 
	key: settings.contextio.key 
	secret: settings.contextio.secret

class EmailHandler extends EventEmitter
	constructor: ->
		# variable for contextio
		@ctxioID = ""
		@ctxioemail = ""
		# starting timestamp
		@timestamp = 1
		# control flow
		# call sync and trigger a full mailbox check when ID retrieved
		@on "getIDSuccess", @_sync
		@on "getIDSuccess", @_listMessages
		# call sync when prompted by timeout
		@on "DoSync", @_sync
		# call list when prompted by timeout
		@on "DoList", @_listMessages
		# after messages listed, check to see which are unread
		@on "listMessagesSuccess", @_filterNewMessages
		# filtered list of new messages found, ask to be flagged and processed
		@on "filterNewMessagesSuccess", @_checkNewMessages
		# marked as read ok, now get message
		@on "flagMessageSuccess", @_getMessage
		# message read ok, now get any attachments
		@on "getMessageSuccess", @_getMessageAttachments
		# attachments retrieved, now process
		@on "getMessageAttachmentsSuccess", @_processMessage 
		# message pared down to only required info, hand off to create ticket
		@on "processMessageSuccess", (msgid, message) -> tickethandler.addTicket message, null, msgid
		# on db ticket write success, move mail and send autoreply
		tickethandler.on "addTicketSuccess", (id, isNew, msgid) => 
			@_moveMessage msgid, settings.contextio.endbox
			@_autoReply id, isNew
		@on "sendMail", @sendMail

	# PUBLIC FUNCTIONS
	getID: (emailaddr, callback) ->
		@ctxioemail = emailaddr
		ctxioClient.accounts().get
			email: emailaddr
			status_ok: 1
		, (err, response) =>
			if err 
				callback err
			else 
				if response.body?.length > 0
					@ctxioID = response.body[0].id 
					@emit "getIDSuccess", @ctxioID
					callback null
				else
					callback "Working ContextIO ID for " + settings.contextio.email + " could not be found."

	sendMail: (mail, id) ->
		# add settings 'from' address, send mail
		mail.from = settings.smtpFrom
		smtpServer.sendMail mail, (err, res) =>
			if err
				@emit "smtpSendFailure", err, mail.to
			else
				@emit "smtpSendSuccess", mail.to
				# add email to ticket
				tickethandler.updateEmailsById id, mail, (err) ->
					@emit "smtpTicketUpdateFailure", err, mail.to if err

	flagMessage: (msgid) ->
		# first, we flag as read to stop duplicate attempts on the same message
		ctxioClient.accounts(@ctxioID).messages(msgid).flags().post
			seen: 1
		, (err, response) =>
			if err or !response.body.success
				@emit "flagMessageError", err, message, response.body
			else
				@emit "flagMessageSuccess", msgid

	
	# INTERNAL FUNCTIONS

	_sync: ->
		# after 1 minute trigger the next sync
		setTimeout (=>
			@emit "DoSync"
		), (60 * 1000)	

		# tell contextio to sync all mail records for account
		ctxioClient.accounts(@ctxioID).sync().post (err, response) =>
			@emit "SyncFailure", @ctxioID if err
			@emit "SyncSuccess" unless err

	_listMessages: ->
		# after 10 minutes trigger the next full list check - this is just belt and braces 
		# the webhook should notify us of new messages as they occur
		setTimeout (=>
			@emit "DoList"
		), (10 * 60 * 1000)	
		# get list of recent messages in inbox
		ctxioClient.accounts(@ctxioID).messages().get
			"folder": settings.contextio.inbox
			"indexed_after": @timestamp
		, (err, response) =>
			@emit "listMessagesError", "unable to find new messages: " + err if err
			@emit "listMessagesSuccess", response.body unless err

	_filterNewMessages: (list) ->
		testIsRead = (msg, callback) =>
			# contextio doesn't save message flags, so each message will be checked against imap
			ctxioClient.accounts(@ctxioID).messages(msg.message_id).flags().get (err, response) ->
				# in the event of an error, best to just ignore the message
				callback false if err
				# otherwise send back status of 'seen' flag 
				callback response.body.seen unless err

		async.reject list, testIsRead, (filteredlist) =>
			# results is now a list of unread message objects
			@emit "filterNewMessagesSuccess", filteredlist

	_checkNewMessages: (list) ->
		# for each new message, call to flag as read (and retrieve and process) on each message
		iterator = (msg, callback) =>
			@flagMessage msg.message_id
			callback null
		async.forEach list, iterator, (err) =>
			@emit "checkNewMessagesError" if err

	_getMessage: (msgid) ->
		# retrieve email message context from contextio, with body retrieved on our behalf
		ctxioClient.accounts(@ctxioID).messages(msgid).get
			include_body: 1
		, (err, response) =>
			if err 
				@emit "getMessageError", err, msgid, response.body
			else
				# update timestamp to latest message indexed
				if @timestamp < response.body.date_indexed
					@timestamp = response.body.date_indexed
				@emit "getMessageSuccess", msgid, response.body

	_getMessageAttachments: (msgid, msg) ->
		retrieveFile = (fileHeader, callback) =>
			ctxioClient.accounts(@ctxioID).files(fileHeader.file_id).content().get (err, filecontent) ->
				if err
					callback err
				else
					file = 
						"file_id" : fileHeader.file_id
						"message_id" : msgid
						"type" : fileHeader.type
						"name" : fileHeader.file_name
						"content" : filecontent
					callback null, file
		if msg.files
			async.mapSeries msg.files, retrieveFile, (err, results) =>
				if err 
					@emit "getMessageAttachmentsError", err, msgid
				else
					@emit "getMessageAttachmentsSuccess", msgid, msg, results
		else @emit "getMessageAttachmentsSuccess", msgid, msg, []

	_processMessage: (msgid, msg, files) ->
		checkbodytype = (obj) ->
			if obj.type is "text/plain"
				procmail.plaintext = obj.content
			else if obj.type is "text/html"
				procmail.html = obj.content
			return null

		procmail = {}
		procmail.date = new Date()
		procmail.from = msg.addresses.from.email or null
		procmail.to = @ctxioemail or null
		procmail.subject = msg.subject or null
		procmail.plaintext = null
		procmail.html = null
		checkbodytype obj for obj in msg.body
		procmail.attachments = files or []

		@emit "processMessageSuccess", msgid, procmail

	_moveMessage: (msgid, destination) ->
		ctxioClient.accounts(@ctxioID).messages(msgid).post
			dst_folder: destination
			move: 1
		, (err, response) =>
			if err 
				@emit "moveMessageError", err
			else
				# TODO - gmail leaves message in inbox, need to force it
				@emit "moveMessageSuccess", msgid


	_autoReply: (id, isNew) ->
		outmail = {}
		tickethandler.findById id, (err, ticket) =>
			if err
				@emit "autoReplyError", err, id
			else		
				outmail.to = ticket.from
				if isNew
					outmail.subject = "RE: " + ticket.subject + " - " + lang.newAutoReply.subject + " - ID: <" + id + ">"
					outmail.html = "<html><header></header><body>"+lang.newAutoReply.body + ticket.description + "</body></html>"
				else
					outmail.subject = "RE: " + ticket.subject + " - " + lang.existingAutoReply.subject + " - ID: <" + id + ">"	
					outmail.html = "<html><header></header><body>" + lang.existingAutoReply.body + "</body></html>"				
				@emit "sendMail", outmail, id

module.exports = EmailHandler