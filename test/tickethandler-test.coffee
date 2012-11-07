#
# mocha test framework for lib/tickethandler.coffee
#

# libraries
chai = require 'chai' 
should = chai.should() 
mongoose = require "mongoose"
async = require "async"
events = require "events"

{tickethandler} = require "../lib"
ticketmodel = require "../lib/models/ticket"
settings = require "../settings"
lang = require "../lang/english"

# ticket generator function
genticket = (number,status) ->
	i=0
	while i < number
		ticket = new ticketmodel(
			date: new Date()
			from: "test@example.com"
			subject: "test"
			description: "test description"  
			status: status
			impact: "normal"
		)
		ticket.save()
		i++

describe "TicketHandler", ->
	before (done) ->
		mongoose.connect 'mongodb://localhost/gravedesk-test', ->
			ticketmodel.remove done

	describe "findAll", ->
		before ->
			genticket(2,"Open")
		it "responds with all ticket records", (done) ->
			tickethandler.findAll (err, res) ->
				return done(err)  if err
				res.should.have.length 2
				done()

	describe "findByStatus", ->
		before ->
			genticket(1, "Closed")
		it "responds with all Open tickets", (done) ->
			tickethandler.findByStatus "Open", (err, res) ->
				return done(err)  if err
				res.should.have.length 2
				done()			
		it "responds with all Closed tickets", (done) ->
			tickethandler.findByStatus "Closed", (err, res) ->
				return done(err)  if err
				res.should.have.length 1
				done()	

	describe "countAllByStatus", ->
		before ->
			genticket(2,"Closed")
		it "responds with ticket counts per status", (done) ->
			tickethandler.countAllByStatus ["Open","Closed"], (err,res) ->
				return done(err) if err
				res.Open.should.equal 2
				res.Closed.should.equal 3
				done()

	describe "findById", ->
		tempTicket = {}
		it "finds one ticket by unique id", (done) ->
			async.waterfall [(callback) ->
				tickethandler.findAll callback 
			, (all,callback) ->
				tempTicket = all[0]
				tickethandler.findById tempTicket._id,callback
			, (ticket, callback) ->
				ticket._id.should.eql tempTicket._id
				callback(null)
			], done

	describe "deleteById", ->
		tempTicket = {}
		it "deletes one ticket by unique id", (done) ->
			# finds the first ticket, deletes it, checks it no longer exists
			async.waterfall [(callback) ->
				tickethandler.findAll callback
			,	(all, callback) ->
				tempTicket = all[0]
				tickethandler.deleteById tempTicket._id, callback
			, (callback) ->
				tickethandler.findById tempTicket._id, callback
			], (err, res) ->
				return done(err) if err
				should.not.exist res
				done()

				
	describe "updateById", ->
		tempTicket = {}
		it "updates one ticket by unique id", (done) ->
			# finds the first ticket, updates it, checks it's been updated
			async.waterfall [(callback) ->
				tickethandler.findAll callback
			, (all, callback) ->
				tempTicket = all[0]
				tempTicket.subject = "new subject"
				tickethandler.updateById tempTicket._id, tempTicket, callback
			, (numberChanged,callback) ->
				tickethandler.findById tempTicket._id, callback
			], (err, res) ->
				return done(err) if err
				res.subject.should.equal "new subject"
				done()

	describe "updateEmailsById", ->
		tempTicket = {}
		it "updates one tickets email array by unique id", (done) ->
			# finds the first ticket, updates it, checks it's been updated
			async.waterfall [(callback) ->
				tickethandler.findAll callback
			, (all, callback) ->
				tempTicket = all[0]
				testEmail = 
					to: "test@example.com"
					cc: ""
					subject: "Test email"
					date: new Date()
					plaintext: "This is a test email"
					html: ""
					attachments : []
				tempTicket.emails.push testEmail

				tickethandler.updateEmailsById tempTicket._id, tempTicket, callback
			, (numberChanged,callback) ->
				tickethandler.findById tempTicket._id, callback
			], (err, res) ->
				return done(err) if err
				res.emails[0].subject.should.equal "Test email"
				res.emails[0].to.should.equal "test@example.com"
				done()

	describe "addTicket", ->
		it "creates a new blank ticket", (done) ->
			tempTicket = 
				date: new Date()
				from: "addticket@example.com"
				to: "test@example.com"
				subject: "test ticket"
				attachments: []
				plaintext: "Hello world"

			tickethandler.on "doTicketAttachments", (mail, id, isnew) ->
				mail.from.should.equal "addticket@example.com"
				mail.to.should.equal "test@example.com"
				mail.subject.should.equal "test ticket"
				mail.plaintext.should.equal "Hello world"
				should.exist mail.date
				should.exist id
				isnew.should.equal true
				tickethandler.findById id, (err,res) ->
					res.from.should.equal "addticket@example.com"
					res.subject.should.equal "test ticket"
					res.description.should.equal "<p>Hello world</p>"
					should.exist res.date
					should.exist res.lastmodified
					res.status.should.equal lang.blankticket.status
					res.impact.should.equal lang.blankticket.impact
					done(err) 

			tickethandler.addTicket(tempTicket)













