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
	search: (tag, callback) ->
		callback null, []
	status: (box, callback) ->
		callback null, []
	addFlags: (id, flags, callback) ->
		callback null
	move:	(id, mailbox, callback) ->
		callback null



describe "EmailHandler:", ->

	describe "connectImap", ->
		before (done) ->
			# create stub imap server
			class connectFake extends FakeImapServer
				openBox: (box, callback) ->
					callback "Unable to connect to mailbox"

			fake = new connectFake
			@emailhandler = new EmailHandler fake
			done()

		it "connects to IMAP server", (done) ->
			@emailhandler.once "imapConnectionSuccess", ->
				done()

			@emailhandler.connectImap()

	describe "fetchMail", ->
		before (done) ->
			# create stub imap server
			class fetchFake extends FakeImapServer
				openBox: (box, callback) ->
					callback null, 
					name: "Inbox"

			fake = new fetchFake
			@emailhandler = new EmailHandler fake
			done()

		it "fetches mail from IMAP server, completes when 0 mails", (done) ->
			@emailhandler.once "fetchMessagesAmount", (quantity) ->
				quantity.should.equal 0
				done()

			@emailhandler.connectImap()



