# required modules
{EventEmitter} = require "events" 
# {MailParser} = require "mailparser"
# nodemailer = require "nodemailer"

# settings = require "../settings"
# lang = require "../lang/english"
# {tickethandler} = require "../lib"

class EmailHandler extends EventEmitter
	constructor: (@imapServer) ->
		@alreadyFetching = false
		@alreadyConnected = false
		# on new or updated mail event, fetch it
		#@imapServer.on "mail", -> @_justFetch()
		#@imapServer.on "msgupdate", -> @_justFetch()
		# on imap server close, re-connect
		@on "imapConnectionClosed", -> @connectImap()
		# on imap connection, fetch mail
		@on "imapConnectionSuccess", -> @_justFetch()
		# every 25 minutes, close imap server connection to keep things tidy
		setTimeout (->
			@alreadyFetching = false
			@alreadyConnected = false
			imapServer.logout( =>
				@emit "imapConnectionClosed"
			)
		), (25 * 60 * 1000)

	connectImap: ->
		# check for existing connection
		if @alreadyConnected
			console.log "IMAP connection already open; moving on."
			@emit "imapConnectionSuccess"
		else
			# mail server not connected; start a fresh connection.
			console.log "Connnecting to IMAP server;"
			@imapServer.connect (err) =>
				if err
					console.error "Failure to connect to IMAP server; " + err
					@emit "imapConnectionFailure"
				else
					console.log "IMAP server connected OK."
					@alreadyConnected = true
					@emit "imapConnectionSuccess"

	# INTERNAL FUNCTIONS

	_justFetch: ->
		console.log "Here's where we connect and fetch email"
		@emit "fetching"


module.exports = EmailHandler