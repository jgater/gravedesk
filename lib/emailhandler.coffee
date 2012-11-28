# required modules
{EventEmitter} = require "events" 
async = require "async"
{MailParser} = require "mailparser"
{tickethandler} = require "../lib"

# nodemailer = require "nodemailer"
# lang = require "../lang/english"
settings = require "../settings"



class EmailHandler extends EventEmitter
	constructor: (@imapServer) ->
		@alreadyFetching = false
		@alreadyConnected = false
		# on new or updated mail event, fetch it
		@imapServer.on "mail", => @_justFetch()
		@imapServer.on "msgupdate", => @_justFetch()	
		# on close notice, clean up existing connection
		@on "imapConnectionClose", => @_connectImapCleanup()
		# on imap connection, fetch mail
		@on "imapConnectionSuccess", -> @_justFetch()
		# on fetch completion
		@on "fetchSuccess", -> @alreadyFetching = false
		# after mail parsed, process
		@on "parseSuccess", (mail, uid) -> @_processMail mail, uid
		# after mail processed, save to database
		@on "processSuccess", (mail, uid) -> @_saveMail mail, uid
		# on db ticket write success, mark mail as read
		tickethandler.on "addTicketSuccess", (id, isNew, uid) => @_imapFlags id, isNew, uid


	# PUBLIC FUNCTIONS

	connectImap: ->
		# check for existing connection
		if @alreadyConnected
			# IMAP connection already open; moving on
			@emit "imapConnectionSuccess"
		else
			# mail server not connected; start a fresh connection.
			@imapServer.connect (err) =>
				if err
					@emit "imapConnectionFailure", err
				else
					@alreadyConnected = true
					@imapServer.status "processed", (err) =>
						# if final destination folder for processed mails does not exist, create it
						if err 
							@imapServer.addBox settings.imap.endbox, (err) =>
								@emit "imapConnectionFailure", err
						# setup next retry
						@_connectImapRetry()		
						@emit "imapConnectionSuccess"		

					

	# INTERNAL FUNCTIONS

	_connectImapCleanup: ->
		# If think already connected, logout
		console.log "alreadyConnected? " + @alreadyConnected
		if @alreadyConnected
			@imapServer.logout (err) =>
				console.log "IMAP logged out"
				@emit "imapLogoutFailure", err

		# cleanup internal state
		@alreadyFetching = false
		@alreadyConnected = false
		setTimeout (=> 
			# wait 10 seconds for safety then connect
			@connectImap()
		), (10*1000)


	_connectImapRetry: ->
		# after 25 minutes, close imap server connection to keep things tidy
		setTimeout (=>
			console.log "Logging out"
			@emit "imapConnectionClose"

		), (25 * 60 * 1000)	

	_justFetch: ->
		unless @alreadyFetching
			@_startFetching()
		else
			setTimeout (=>
				# wait 5 seconds, try again
				@emit "imapConnectionSuccess"
			), (5 * 1000)


	_startFetching: ->
		@alreadyFetching = true
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
				else
					@alreadyFetching = false

				callback null

			], (err, result) =>
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
		@emit "processSuccess", procmail, uid

	_saveMail: (mail, uid) ->
		#handoff mail to db for writing
		tickethandler.addTicket mail, null, uid

	_imapFlags: (id, isNew, uid) ->
		# mark as seen, move to final destination mailbox
		async.series [
			(callback) =>
				@imapServer.addFlags uid, "Seen", callback

			, (callback) =>
				@imapServer.move uid, settings.imap.endbox, callback

		], (err, res) =>	
				# now mail has been marked as read on imap, we can now mail the sender safely with our autoresponse
				#if wasNew
				#  newAutoRespond ticket
				#else
				#  existingAutoRespond ticket, mail

	





module.exports = EmailHandler