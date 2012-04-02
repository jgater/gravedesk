var imapServerSettings = {		
	"username": "username",
	"password": "password",
	"host": "imap.example.com",
	"port": "993",
	"secure": "true",
	"box": "Inbox"
	};
var statusList = ['Open', 'Pending', 'Longterm', 'Systems', 'Closed'];
var brand = "Gravedesk";

var blankTicketSettings = {
	"from": "unknown@example.com",
	"subject": "No subject given.",
	"description": "No description given."
};

var defaultAdmin = {
	username: "admin",
	password: "changeme",
	firstname: "Default",
	lastname: "Admin",
	email: "admin@example.com"
}











//-------------------------------


var settingsModel = function () {
	this.imap = imapServerSettings;
	this.statusList = statusList;
	this.blankticket = blankTicketSettings;
	this.blankticket.status = statusList[0];
	this.brand = brand;
	this.defaultAdmin = {
		"username": defaultAdmin.username,
		"fname": defaultAdmin.firstname,
		"lname": defaultAdmin.lastname,
		"email": defaultAdmin.email,
		"password": defaultAdmin.password,
		"isAdmin": true
	};
};
    
module.exports = new settingsModel();