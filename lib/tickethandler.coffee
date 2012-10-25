# required modules
events = require "events" 
async = require "async"

# model dependency
ticketmodel = require("./models/ticket")
#settings = require "../settings" 

class TicketHandler
	#find all tickets
	findAll: (callback) -> ticketmodel.find {}, callback

	#find limited fields by status
	findByStatus: (status, callback) -> 
		status = status: status
		fields = "_id from subject date impact lastmodified"
		ticketmodel.find status, fields, callback

	# count all tickets by status, provide object back suitable for injection mapping into knockout.js
	countAllByStatus: (statusList,callback) ->
		iterator = (status, cb) ->
			status = status: status
			ticketmodel.count status, cb

		statusObject = {}
		async.map statusList, iterator, (err, counts) ->
			unless err
				for i of statusList
					statusObject[statusList[i]] = counts[i]
				callback null, statusObject
			else
				callback err

	#Find ticket by ID
	findById: (id, callback) ->
  ticketmodel.findById id, (err, ticket) ->
    if err or ticket is null
      callback err
    else
      callback null, ticket




module.exports = TicketHandler
