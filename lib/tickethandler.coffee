# required modules
events = require("events")
settings = require("../settings")

# model dependency
ticketmodel = require("./models/ticket")

class TicketHandler
	findAll: (callback) -> ticketmodel.find {}, callback

module.exports = TicketHandler
