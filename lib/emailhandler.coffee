# required modules
{EventEmitter} = require "events" 
async = require "async"
{MailParser} = require "mailparser"
{tickethandler} = require "../lib"
lang = require "../lang/english"
settings = require "../settings"


class EmailHandler extends EventEmitter
	constructor: (@imapServer, @smtpServer) ->
		# on new or updated mail event, fetch it
		@imapServer.on "mail", => @_justFetch()
		@imapServer.on "msgupdate", => @_justFetch()
		# on connection close, reconnect
		@imapServer.on "close", => @connectImap()

		@on "imapConnectionFailure", => 
			# on connection failure, wait 10 seconds, try again
			setTimeout (=>
				@connectIamp()
			), (5 * 1000)	
		# on imap connection, fetch mail
		@on "imapConnectionSuccess", -> @_justFetch()

		# if test fetch fails, reconnect
		@on "fetchMessagesFailure", => @connectImap()
		# do a fetch when asked
		@on "justFetch", -> @_justFetch()

		# after mail parsed, process
		@on "parseSuccess", (mail, uid) -> @_processMail mail, uid
		# on db ticket write success, mark mail as read
		tickethandler.on "addTicketSuccess", (id, isNew, uid) => @_imapFlags id, isNew, uid
		# on flag success, send autoreply
		@on "imapFlagSuccess", (id, isNew, uid) => @_autoReply id, isNew


	# PUBLIC FUNCTIONS

	connectImap: ->
		# mail server not connected; start a fresh connection.
		@imapServer.connect (err) =>
			if err
				@emit "imapConnectionFailure", err
			else
				@imapServer.status settings.imap.endbox, (err) =>
					# if final destination folder for processed mails does not exist, create it
					if err 
						@imapServer.addBox settings.imap.endbox, (err) =>
							@emit "imapConnectionFailure", err if err
							@emit "imapConnectionSuccess" unless err
					else				
						@emit "imapConnectionSuccess"		

	sendMail: (mail, id) ->
		# add settings 'from' address, send mail
		mail.from = settings.smtpFrom
		@smtpServer.sendMail mail, (err, res) =>
			if err
				@emit "smtpSendFailure", err, mail.to
			else
				@emit "smtpSendSuccess", mail.to
				# add email to ticket
				tickethandler.updateEmailsById id, mail, (err) ->
					@emit "smtpTicketUpdateFailure", err, mail.to if err

	# INTERNAL FUNCTIONS


	_testImap: ->
		# after 20 minutes do a manual fetch
		setTimeout (=>
			@emit "justFetch"
		), (20 * 60 * 1000)	

	_justFetch: ->
		# schedule the next imap fetch
		@_testImap()

		async.waterfall [
			(callback) =>
				@imapServer.openBox settings.imap.box, callback

			, (box, callback) =>
				@imapServer.search [ 'UNSEEN' ], callback

			, (messages, callback) =>
				@emit "fetchMessagesAmount", messages.length
				if messages.length
					fetch = @imapServer.fetch(messages,
						request:
							body: "full"
							headers: false 
					)
					fetch.on "message", (msg) =>
						@_fetchEachMail msg

					fetch.on "end", => 
						@emit "fetchSuccess"

				callback null

			], (err) =>
				@emit "fetchMessagesFailure", err if err


	_fetchEachMail: (msg) ->
		mailparser = new MailParser() 
		# when mailparser finished parsing a mail, send it off for database writing
		mailparser.on "end", (mail) =>
			@emit "parseSuccess", mail, msg.uid

		msg.on "data", (data) ->
			mailparser.write data.toString()

		msg.on "end", ->
			mailparser.end()

	_processMail: (mail, uid) ->
		procmail = {}
		procmail.date = new Date()
		procmail.from = mail.from[0].address or null
		procmail.to = mail.to[0].address or null
		procmail.subject = mail.subject or null
		procmail.plaintext = mail.text or null
		procmail.html = mail.html or null
		procmail.attachments = mail.attachments or []
		#handoff mail to db for writing
		tickethandler.addTicket procmail, null, uid

	_imapFlags: (id, isNew, uid) ->
		# mark as seen, move to final destination mailbox
		async.series [
			(callback) =>
				@imapServer.addFlags uid, "Seen", callback

			, (callback) =>
				@imapServer.move uid, settings.imap.endbox, callback

		], (err, res) =>	
			@emit "imapFlagFailure", err, uid if err
			@emit "imapFlagSuccess", id, isNew, uid unless err

	_autoReply: (id, isNew) ->
		outmail = {}
		tickethandler.findById id, (err, ticket) =>
			if err
				@emit "autoReplyFailure", err, id
			else		
				outmail.to = ticket.from

				if isNew
					outmail.subject = "RE: " + ticket.subject + " - " + lang.newAutoReply.subject + " - ID: <" + id + ">"
					outmail.html = "<html><header></header><body>"+lang.newAutoReply.body + ticket.description + "</body></html>"
				else
					outmail.subject = "RE: " + ticket.subject + " - " + lang.existingAutoReply.subject + " - ID: <" + id + ">"	
					outmail.html = "<html><header></header><body>" + lang.existingAutoReply.body + ticket.description + "</body></html>"
	
				@sendMail outmail, id
	

	





module.exports = EmailHandler