# required modules
{EventEmitter} = require "events" 
async = require "async"

# model dependency
ticketmodel = require "./models/ticket"
#settings = require "../settings" 

class TicketHandler extends EventEmitter

	constructor: ->
		#@on 'wake', -> console.log 'COCKADOODLEDOO!'

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
		ticketmodel.findById id, (err,result) ->
			callback(err,result)


	#Delete ticket by ID
	deleteById: (id, callback) ->
		self = this
		ticketmodel.findById id, (err, ticket) ->
			ticket.remove (err, result) ->
				#self.emit 'ticketListChange'
				#self.deleteAttachments(id,callback);
				callback(err,result)



module.exports = TicketHandler
