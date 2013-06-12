TicketHandler = require "./tickethandler"
exports.tickethandler = new TicketHandler

DBHandler = require "./dbhandler"
exports.db = new DBHandler

EmailHandler = require "./emailhandler"
exports.emailhandler = new EmailHandler
