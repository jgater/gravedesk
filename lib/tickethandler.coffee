# required modules
{EventEmitter} = require "events" 
async = require "async"
path = require "path"
fs = require "fs"
rimraf = require "rimraf"
{Markdown} = require "node-markdown"

# model dependency
ticketmodel = require "./models/ticket"
settings = require "../settings" 
lang = require "../lang/english"


class TicketHandler extends EventEmitter

	constructor: ->
		@on "ticketDeleted", @_deleteAttachments

		# newticket workflow
		@on "createNewTicket", @_createNewTicket
		@on "modifyCurrentTicket", @_modifyCurrentTicket
		@on "doTicketAttachments", @_doTicketAttachments
		@on "saveAttachments", @_saveAttachments 


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
			@emit "addTicketError", err if err

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
			@emit "addTicketError", err if err
			@emit "doTicketAttachments", params, ticket._id, true unless err


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

	# process new mail attachments
	_doTicketAttachments : (params, id, isNew) ->
		self = this
		# find existing ticket
		ticketmodel.findById id, (err, ticket) ->	
			if params.attachments
				# remove attachments from new email
				attachments = params.attachments.splice 0, params.attachments.length
			else
				attachments = []
			# check how many emails have already been attached
			index = ticket.emails.length or 0
			date = new Date()

			# function to generate attachment 'stub' names
			iterator = (item, cb) ->
				if item.transferEncoding is "base64"
					stub = {}
					stub.date = date
					stub.fileName = encodeURIComponent(index + "_" + item.fileName)
					stub.contentType = item.contentType
					cb null, stub
				else
					cb null, null

			# go through attachment list, generate stubs
			async.map attachments, iterator, (err, results) ->
				if err 
					@emit "addTicketError", err
				else
					# need to clean non file stubs nulls from results
					iterator = (item, cb) ->
						if item
							cb true
						else
							cb false
		
					async.filter results, iterator, (results) ->
						# add stub attachments to original new email
						params.attachments = results
						# add now modified email to ticket
						ticket.emails.push params
						ticket.save (err) ->
							self.emit "addTicketError", err if err
							self.emit "saveAttachments", attachments, index, id, isNew unless err


	_saveAttachments : (attachments, index, id, isNew) ->
		# force id and index to string
		id = id + ""
		index = index + ""
		if attachments
			# create directory for attachments unless it already exists
			fs.mkdirSync settings.attachmentDir unless fs.existsSync settings.attachmentDir
			# create directory for ticket id unless it already exists
			ticketPath = path.join settings.attachmentDir, id
			fs.mkdirSync path.join ticketPath unless fs.existsSync ticketPath

		iterator = (item, callback) ->
			if item.transferEncoding is "base64"
				base64Data = item.content
				dataBuffer = new Buffer(base64Data, "base64")
				filePath = path.join(ticketPath, index + "_" + item.fileName)
				fs.writeFileSync filePath, dataBuffer, callback
			else
				callback null

		# write out each individual attachment to disk
		async.forEachSeries attachments, iterator, (err) =>
			if err
				@emit "addTicketError", err
			else 
				# modified new email saved to ticket, attachments saved to disk. Declare victory
				@emit "addTicketSuccess", id, isNew

module.exports = TicketHandler
