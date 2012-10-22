chai = require 'chai'  
chai.should()  

dbhandler = require "../lib/dbhandler"
ticketprovider = dbhandler.TicketProvider
mongoose = require "mongoose"
ticketmodel = require "../lib/models/ticket"

describe "TicketProvider", ->
	before (done) ->
		mongoose.connect 'mongodb://localhost/gravedesk-dev', ->
			ticketmodel.remove done

	describe "countAllByStatus", (done) ->
		it "counts numbers of tickets by status", ->
			ticketprovider.countAllbyStatus
			done

	describe "findAll", (done) ->
		it "finds all tickets", ->
			ticketprovider.findAll
			done

	describe "findAllIds", (done) ->
		it "finds all ticket IDs", ->
			ticketprovider.findAllIds
			done

	describe "findByStatus", (done) ->
		it "finds limited fields by status", ->
			ticketprovider.findByStatus
			done

	describe "findById", (done) ->
		it "finds one ticket by ID", ->
			ticketprovider.findById
			done

	describe "deleteById", (done) ->
		it "deletes one ticket by ID", ->
			ticketprovider.deleteById
			done

	describe "ticketFromEmail", (done) ->
		it "creates a new ticket from an email", ->
			ticketprovider.ticketFromEmail
			done	

	describe "newTicket", (done) ->
		it "creates a new ticket", ->
			ticketprovider.newTicket
			done		

	describe "attachmentStubs", (done) ->
		it "creates data/filename/content-type info from attachments", ->
			ticketprovider.attachmentStubs
			done	

	describe "saveAttachments", (done) ->
		it "saves attachments to disk", ->
			ticketprovider.saveAttachments
			done

	describe "deleteAttachments", (done) ->
		it "deletes attachments when ticket deleted", ->
			ticketprovider.deleteAttachments
			done

	describe "updateTicketEmailsById", (done) ->
		it "updates a specific ticket's email array", ->
			ticketprovider.updateTicketEmailsById
			done

	describe "updateTicketById", (done) ->
		it "updates a specific ticket", ->
			ticketprovider.updateTicketById
			done
