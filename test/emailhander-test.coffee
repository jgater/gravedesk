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

class FakeImapServer extends EventEmitter

	connect: (callback) ->
		callback null

	openBox: (box, callback) ->
		callback "Unable to connect to mailbox"


describe "EmailHandler:", ->

	describe "connectImap", ->
		before (done) ->
			fake = new FakeImapServer
			@emailhandler = new EmailHandler fake
			done()

		it "connects to imap server", (done) ->
			@emailhandler.once "imapConnectionSuccess", ->
				done()

			@emailhandler.connectImap()


	