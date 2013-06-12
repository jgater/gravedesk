# required modules

{tickethandler} = require "../lib"
{EventEmitter} = require "events" 
settings = require "../settings"
lang = require "../lang/english"
nodemailer = require "nodemailer"
contextio = require "contextio"

# define smtp server transport
smtpServer = nodemailer.createTransport("SMTP", settings.smtp)

# define context IO client 
ctxioClient = new contextio.Client '2.0', 
	key: settings.contextio.key 
	secret: settings.contextio.secret

class EmailHandler extends EventEmitter
	constructor: ->
		@ctxioID = ""
		# call sync method
		@on "DoSync", -> @sync (err) => @emit "SyncError", err if err

		# on db ticket write success, send autoreply
		tickethandler.on "addTicketSuccess", (id, isNew, uid) => @_autoReply id, isNew

	# PUBLIC FUNCTIONS
	setID: (callback) ->
		ctxioClient.accounts().get
  		email: settings.contextio.email
  		status_ok: 1
		, (err, response) =>
			if err 
				callback err
			else 
				if response.body?.length > 0
					@ctxioID = response.body[0].id 
					callback null, "ContextIO ID for " + settings.contextio.email + " successfully set to " + @ctxioID
				else
					callback "Working ContextIO ID for " + settings.contextio.email + " could not be found."

	sync: (callback) ->
		# after 30 minutes trigger the next sync
		setTimeout (=>
			@emit "DoSync"
		), (30 * 60 * 1000)	

		# tell contextio to sync all mail records for account
		ctxioClient.accounts(@ctxioID).sync().post (err, response) =>
			callback err if err
			if response.body.success 
				@emit "SyncSuccess"
				callback null
			else
				callback "ContextIO sync request unsuccessful."

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
					outmail.html = "<html><header></header><body>" + lang.existingAutoReply.body + ticket.description + "</body></html>"
	
				@sendMail outmail, id

module.exports = EmailHandler