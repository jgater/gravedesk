// You'll want to change these. Any email in the 'box' folder will be marked as read once processed.

var imapServerSettings = {		
	"username": "username",
	"password": "password",
	"host": "imap.example.com",
	"port": "993",
	"secure": "true",
	"box": "Inbox"
	};

// the first entry in the statusList will be the default for new tickets. 'Closed' is currently mandatory.
// All other statuses are optional

var statusList = ['Open', 'Pending', 'Longterm', 'Systems', 'Closed'];

// Branding will show up throughout the web interface.

var brand = "Gravedesk";

// emails that are missing fields, or that cannot be properly parsed will be replaced by entries from this as needed.

var blankTicketSettings = {
	"from": "unknown@example.com",
	"subject": "No subject given.",
	"description": "No description given."
};

// default account used to administer the systems, and add additional admin accounts.

var defaultAdmin = {
	username: "admin",
	password: "changeme",
	firstname: "Default",
	lastname: "Admin",
	email: "admin@example.com"
}



//--------------------------------
No need to make changes below this
//--------------------------------


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