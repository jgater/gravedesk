#
# mocha test framework for lib/emailhandler.coffee
#

# libraries
chai = require 'chai' 
should = chai.should() 
async = require "async"

{emailhandler} = require "../lib"
settings = require "../settings"
lang = require "../lang/english"


describe "EmailHandler:", ->

	describe "connectImap", ->
			it "connects to imap server", (done) ->
				emailhandler.once "fetching", ->
					done()

				emailhandler.connectImap()


	