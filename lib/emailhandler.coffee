# required modules
{EventEmitter} = require "events" 
async = require "async"
{MailParser} = require "mailparser"
# nodemailer = require "nodemailer"

settings = require "../settings"
# lang = require "../lang/english"
# {tickethandler} = require "../lib"

class EmailHandler extends EventEmitter
	constructor: (@imapServer) ->
		@alreadyFetching = false
		@alreadyConnected = false
		# on new or updated mail event, fetch it
		@imapServer.on "mail", -> @_justFetch()
		@imapServer.on "msgupdate", -> @_justFetch()
		# on unexpected close, wait 10 seconds, try and reconnect
		@imapServer.on "close", -> 
			setTimeout (=> 
				@connectImap()
				@alreadyConnected = false
			), (10*1000)
		# on intentional imap server close, re-connect
		@on "imapConnectionClosed", -> @connectImap()
		# on imap connection, fetch mail
		@on "imapConnectionSuccess", -> @_justFetch()
		# on fetch completion
		@on "fetchSuccess", -> @alreadyFetching = false
		# after mail parsed, save to database
		@on "parseSuccess", (mail, uid) -> @_saveMail mail, uid

		# every 25 minutes, close imap server connection to keep things tidy
		setTimeout (->
			@alreadyFetching = false
			@alreadyConnected = false
			imapServer.logout( =>
				@emit "imapConnectionClosed"
			)
		), (25 * 60 * 1000)

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
					@emit "imapConnectionSuccess"

	# INTERNAL FUNCTIONS

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

	_saveMail: (mail, uid) ->
		console.log "saving uid " + uid

	





module.exports = EmailHandler