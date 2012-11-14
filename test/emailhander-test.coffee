#
# mocha test framework for lib/emailhandler.coffee
#

# libraries
chai = require 'chai' 
should = chai.should() 
async = require "async"

{EventEmitter} = require "events" 

EmailHandler = require "../lib/emailhandler"
settings = require "../settings"

# setup imap handler
imap = require "imap"
imapServer = new imap.ImapConnection(
  username: settings.imap.username
  password: settings.imap.password
  host: settings.imap.host
  port: settings.imap.port
  secure: settings.imap.secure
)

class FakeImapServer extends EventEmitter
	constructor: ->

	connect: (callback) ->
		callback null

fake = new FakeImapServer
#emailhandler = new EmailHandler imapServer 
emailhandler = new EmailHandler fake

describe "EmailHandler:", ->

	describe "connectImap", ->
			it "connects to imap server", (done) ->
				emailhandler.once "imapConnectionSuccess", ->
					done()

				emailhandler.connectImap()


	