// You'll want to change the imap and smtp settings at least. Any email in the 'box' folder will be marked as read once processed.

var imapServerSettings = {		
	"username": "user",
	"password": "password",
	"host": "imap.example.com",
	"port": 993,
	"secure": true,
	"box": "Inbox"
	};

var smtpServerSettings = {	
  host: "smtp.example.com", 
  secureConnection: true, 
  port: 465, 
  auth: {
      user: "user",
      pass: "password"
  }
};

// Branding will show up throughout the web interface.
var brand = "Gravedesk";


// the first entry in the statusList will be the default for new tickets. 'Closed' is currently mandatory.
// All other statuses are optional
var statusList = ['Open', 'Pending', 'Longterm', 'Closed'];

// default account used to administer the systems, and add additional admin accounts.
var defaultAdmin = {
	username: "admin",
	password: "changeme",
	firstname: "Default",
	lastname: "Admin",
	email: "admin@example.com"
}

// incoming emails that are missing fields, or that cannot be properly parsed will be replaced by entries from this as needed.

var blankTicketSettings = {
	"from": "unknown@example.com",
	"subject": "No subject given.",
	"description": "No description given."
};

// this will be the default port for node to listen on
var defaultPort = 3000;

// enabling this will setup node itself to work over https - port 443.
// defaultPort will be ignored.
// keys need to be valid for the full DNS hostname the node process will be accessed on - you will have to provide your own!
// they will also need to be copied into the path specified; it's relative to the path of app.js
// finally, you will need to run node as root (via sudo node app.js for example)
var nodeHTTPS = {
	enable: false,
	key: "keys/cert.key",
	cert: "keys/cert.pem"
}

// this will enable the node server to be accessed through a reverse proxy, such as nginx. This is useful if you wish
// to make the node process available through another 'proper' webserver, such as one serving other sites.
// See 'production.md' for further information
var proxy = {
	enable: false,
	proxyPort: 443
}






//-----------------------------------
// Do not make changes below here
//-----------------------------------


var settingsModel = function () {
	this.https = nodeHTTPS;
	this.defaultPort = defaultPort;
	this.proxy = proxy;
	this.imap = imapServerSettings;
	this.smtp = smtpServerSettings;
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