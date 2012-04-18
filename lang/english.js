var settings = require('../settings');

var newAutoReply = {		
	"subject": "Accepted",
	"body": "<p>Thank you for reporting this issue to the "+ settings.brand +" team. It has been added to our list as a new job ticket, and we will look into it as soon as possible.</p><br><br><br><br><br><hr><small>Original description:</small><br><br>"
};

var existingAutoReply = {		
	"subject": "Received",
	"body": "<p>Thank you for your response. It has been added to the ticket.</p><br><br><br><br><br><hr><small>Original description:</small><br><br>"
};

var reply = {
	"subject": "Reply",
	"body" : "<br><br><br><br><br><hr><small>Original description:</small><br><br>"	
};

var closeReply = {
	"subject": "Closed",
	"body": "<p>This job ticket with the "+ settings.brand +" team has now been closed, as we believe the reported issue has been resolved. Thank you.</p><br><br><br><br><br><hr><small>Original description:</small><br><br>"
};














//-----------------------------------
// Do not make changes below here
//-----------------------------------

var langModel = function () {
	this.newAutoReply = newAutoReply;
	this.existingAutoReply = existingAutoReply;
	this.reply = reply;
	this.closeReply = closeReply;
};
    
module.exports = new langModel();