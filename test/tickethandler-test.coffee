chai = require 'chai' 
chai.should() 

{TicketHandler} = require "../lib"
mongoose = require "mongoose"
ticketmodel = require "../lib/models/ticket"

describe "TicketHandler", ->
	tickethandler = new TicketHandler
	before (done) ->
		mongoose.connect 'mongodb://localhost/gravedesk-dev', done

	describe "findAll", ->
		it "responds with all ticket records", (done) ->
			tickethandler.findAll (err, res) ->
				return done(err)  if err
				res.should.have.length 0
				done()					