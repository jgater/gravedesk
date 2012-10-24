# required modules
events = require("events")
settings = require("../settings")

# model dependency
ticketmodel = require("./models/ticket")

class TicketHandler
	#find all tickets
	findAll: (callback) -> ticketmodel.find {}, callback

	#find limited fields by status
	findByStatus: (status, callback) -> ticketmodel.find {}, callback
	
module.exports = TicketHandler
