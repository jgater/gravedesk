# required modules
{EventEmitter} = require "events" 
async = require "async"
path = require "path"
rimraf = require "rimraf"
{Markdown} = require "node-markdown"

# model dependency
ticketmodel = require "./models/ticket"
settings = require "../settings" 
lang = require "../lang/english"


class TicketHandler extends EventEmitter

	constructor: ->
		@on "ticketDeleted", (id) -> @_deleteAttachments id

		# newticket workflow
		@on "addTicketError", (err) -> console.log "Error adding ticket: " + err
		@on "createNewTicket", (params) -> @_createNewTicket params
		@on "modifyCurrentTicket", (params, id) -> @_modifyCurrentTicket params, id
		#@on "doTicketAttachments", (params, id, isnew) -> @_doTicketAttachments params, id, isnew


	# find all tickets
	findAll: (callback) -> ticketmodel.find {}, callback

	# find limited fields by status
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

	# find ticket by ID
	findById: (id, callback) ->
		ticketmodel.findById id, (err,result) ->
			callback(err,result)


	# delete ticket by ID
	deleteById: (id, callback) ->
		ticketmodel.findById id, (err, ticket) =>
			ticket.remove (err) =>
				@emit "ticketDeleted", ticket._id unless err
				callback(err)

	# update ticket by ID	
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
			@emit "ticketUpdated" unless err
			callback err, numAffected

	# update ticket email array by ID
	updateEmailsById: (id, ticket, callback) ->
		conditions = _id: id
		update =
			emails: ticket.emails
			lastmodified: new Date()
	
		ticketmodel.update conditions, update, {}, (err, numAffected) =>
			@emit "ticketUpdated" unless err
			callback err, numAffected

	# create/modify ticket in db
	addTicket : (params, id) ->

		# if id truthy, assume is the id of the ticket to modify 
		return @emit "modifyCurrentTicket", params, id if id

		# else check if ticket already has an ID-like string in subject
		searchstring = null
		if params.subject
			searchstring = params.subject.match(/\<[a-z|A-Z|0-9]*\>/g) 
	
		if searchstring
			# ID-like string found, try and modify an existing ticket
			# strip first and last character
			substring = searchstring.pop().slice(1,-1)
			return @emit "modifyCurrentTicket", params, substring
		else
			# ticket id format not found in subject, create a new ticket.
			return @emit "createNewTicket", params



	# INTERNAL FUNCTIONS

	# delete attachments associated with a ticket
	_deleteAttachments : (id) ->
		filePath = path.join settings.attachmentDir, id
		rimraf filePath, (err) => 
			@emit "ticketListUpdated" unless err
			console.log err if err

	_cleanHTML : (html) ->
		cleanhtml = html or ""
		cleanhtml = cleanhtml.replace(/<html([^>]*)>/i, "")
		cleanhtml = cleanhtml.replace(/<head>.*<\/head>/g, "")
		cleanhtml = cleanhtml.replace(/<body([^>]*)>/i, "")
		cleanhtml = cleanhtml.replace(/<meta([^>]*)>/g, "")
		cleanhtml = cleanhtml.replace(/<xml>.*<\/xml>/g, "")
		cleanhtml = cleanhtml.replace(/<\/html>/i, "")
		cleanhtml = cleanhtml.replace(/<\/body>/i, "")	
		# strip leftover comments
		cleanhtml = cleanhtml.replace(/<!--[\s\S]*?-->/g, "")
		return cleanhtml

	# create new blank ticket
	_createNewTicket : (params) ->
		# search and remove strings of pattern "- text - ID: <text>", i.e. previous autoreplies
		cleansubject = params.subject.replace(/\- [a-z|A-Z]* \- ID: \<[a-z|A-Z|0-9]*\>/g, "") if params.subject
		cleanhtml = @_cleanHTML params.html if params.html
		cleanplaintext = Markdown params.plaintext, true if params.plaintext

		ticket = new ticketmodel(
			date: params.date
			lastmodified: params.date
			from: params.from or lang.blankticket.from
			description: cleanhtml or cleanplaintext or lang.blankticket.description
			subject: cleansubject or lang.blankticket.subject
			status: params.status or lang.blankticket.status
			impact: lang.blankticket.impact
			attachments : []
		)

		ticket.save (err) => 
			@emit "doTicketAttachments", params, ticket._id, true unless err
			@emit "addTicketError", err if err

	# modify possible existing ticket
	_modifyCurrentTicket : (params, id) ->
		ticketmodel.findById id, (err, result) =>	
			if result and result.status isnt "Closed"
				# found a ticket matching the ID that isn't closed
				# replace new ticket subject with existing ticket subject
				params.subject = "RE: " + result.subject
				@emit "doTicketAttachments", params, result._id, false

			else 
				# no open ticket by that ID found - could be < > false positive (mailing lists etc) - create new ticket after all
				@emit "createNewTicket", params




module.exports = TicketHandler
