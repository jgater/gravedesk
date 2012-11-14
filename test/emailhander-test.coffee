#
# mocha test framework for lib/emailhandler.coffee
#

# libraries
chai = require 'chai' 
should = chai.should() 
async = require "async"
imap = require "imap"

EmailHandler = require "../lib/emailhandler"
settings = require "../settings"
lang = require "../lang/english"


# setup imap handler
imapServer = new imap.ImapConnection(
  username: settings.imap.username
  password: settings.imap.password
  host: settings.imap.host
  port: settings.imap.port
  secure: settings.imap.secure
)

emailhandler = new EmailHandler imapServer 


describe "EmailHandler:", ->

	describe "connectImap", ->
			it "connects to imap server", (done) ->
				emailhandler.once "fetching", ->
					done()

				emailhandler.connectImap()


	