chai = require 'chai' 
chai.should() 

{TicketHandler} = require "../lib"
mongoose = require "mongoose"
ticketmodel = require "../lib/models/ticket"

# ticket generator function
genticket = (number) ->
	i=0
	while i < number
		ticket = new ticketmodel(
			date: new Date()
			from: "test@example.com"
			subject: "test"
			description: "test description"  
			status: "Open"
			impact: "normal"
		)
		ticket.save()
		i++

describe "TicketHandler", ->
	tickethandler = new TicketHandler
	before (done) ->
		mongoose.connect 'mongodb://localhost/gravedesk-test', ->
			ticketmodel.remove done
	beforeEach (done) ->
		ticketmodel.remove done
		genticket(1)

	describe "findAll", ->
		it "responds with all ticket records", (done) ->
			tickethandler.findAll (err, res) ->
				return done(err)  if err
				res.should.have.length 1
				done()	
		beforeEach ->


	describe "findByStatus", ->
		it "responds with all tickets of a certain status", (done) ->
			tickethandler.findByStatus "Open", (err, res) ->
				return done(err)  if err
				res.should.have.length 1
				done()				