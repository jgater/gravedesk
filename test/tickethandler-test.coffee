#
# mocha test framework for lib/tickethandler.coffee
#

# libraries
chai = require 'chai' 
should = chai.should() 
mongoose = require "mongoose"
async = require "async"

{TicketHandler} = require "../lib"
ticketmodel = require "../lib/models/ticket"
settings = require "../settings"

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
	tickethandler = new TicketHandler
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
			async.waterfall [(callback) ->
				tickethandler.findAll callback
			,	(all, callback) ->
				tempTicket = all[0]
				tickethandler.deleteById tempTicket._id, callback
			, (callback) ->
				tickethandler.findById tempTicket._id, callback
			], (err, result) ->
				should.not.exist(result)
				return done(err) if err
				done()











