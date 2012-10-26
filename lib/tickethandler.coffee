# required modules
{EventEmitter} = require "events" 
async = require "async"
path = require "path"
rimraf = require "rimraf"

# model dependency
ticketmodel = require "./models/ticket"
settings = require "../settings" 

class TicketHandler extends EventEmitter

	constructor: ->
		@on 'ticketDeleted', (id) -> @_deleteAttachments id

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
		ticketmodel.findById id, (err, ticket) =>
			ticket.remove (err) =>
				@emit 'ticketDeleted', ticket._id unless err
				callback(err)

	updateById: (id, ticket, callback) ->
			conditions = _id: id
			update = 
				status: ticket.status
				impact: ticket.impact
				lastmodified: new Date()
				from: ticket.from
				subject: ticket.subject
				description: ticket.description

			ticketmodel.update conditions, update, {}, (err, numAffected) =>
				@emit 'ticketUpdated'
				callback err, numAffected






	# delete attachments associated with a ticket
	_deleteAttachments : (id) ->
		filePath = path.join settings.attachmentDir, id
		rimraf filePath, (err) => 
			@emit 'ticketListUpdated' unless err
			console.log err if err



module.exports = TicketHandler
