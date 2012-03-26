
// imap email retrieve setup

var MailParser = require('mailparser').MailParser;
var util = require('util');
var async = require('async');
var settings = require('../settings');
var imap = require('imap');
var TicketProvider = require('./dbhandler').TicketProvider;
var db = new TicketProvider();
var sanitizer = require('sanitizer');

var imapServer = new imap.ImapConnection({
		username: settings.imap.username,
		password: settings.imap.password,
		host: settings.imap.host,
		port: settings.imap.port,
		secure: settings.imap.secure
});

// main functions

var ImapHandler = function(){};

ImapHandler.prototype.startMonitoring = function(callback) {
		// listen for new mail; if so fetch them.
		imapServer.on( "mail", function() {
			justFetch(function(err){
				if (err) {console.error(err);}
			});	
		});
		// listen for server connection close; then spawn new connection.
		imapServer.on( "close", function() {
			connectAndFetch(function(err){
				if (err) {console.error(err);}
			});	
		});
		// listen for flag changes on inbox; then fetch.
		imapServer.on( "msgupdate", function() {
			connectAndFetch(function(err){
				if (err) {console.error(err);}
			});	
		});
		// start a new connection to imap to get us rolling, report failure to app.js
	connectAndFetch(callback);
};

var connectAndFetch = function(callback) {
		async.series([
			connectIMAP,
			justFetch,
		],callback);
};

var justFetch = function(callback) {
		async.waterfall([
			openInbox,
			searchInbox,
			fetchInboxMail,	
		],callback);
};


var connectIMAP = function (callback) {
	// To keep things tidy, close connection after 25 minutes
	setTimeout(function(){ 
			imapServer.logout();
		}, (25*60*1000) );
	console.log("Connnecting to IMAP server;");
	imapServer.connect(function(err){
		if (err) { 
			console.error("Failure to connect to IMAP server; " + err);
			callback(err);
		} else {
			console.log("IMAP server connected OK.");
			callback(null);
		}

	});
};
var openInbox = function(callback) {
	imapServer.openBox(settings.imap.box, callback);
};
var searchInbox = function(box,callback) {
			imapServer.search([ 'UNSEEN' ], callback);
};
var fetchInboxMail = function(messages,callback) {	
		console.log("There are " + messages.length + " new emails.");
		if (messages.length) {
			// fetch individual messages
			var fetch = imapServer.fetch(messages, { request: { body: "full", headers: false }, markSeen: false });
			// run fetchMail for each individual mail that results from 'fetch'
			fetch.on('message', fetchEachMail);
			fetch.on('end', fetchMailEnd);
		} 
		callback(null);
};

var fetchEachMail = function(msg) {
	var id = msg.id;
	console.log('Starting fetching message seq no: ' + msg.seqno);
	var mailparser = new MailParser();	
	// when mailparser finished parsing a mail, send it off for databasewriting
	mailparser.on('end', function(mail) {
		saveMail(mail,msg.id);
	});
	
	msg.on('data', function(data) {
		mailparser.write(data.toString());
	});
	
	msg.on('end', function() {
			console.log('Finished fetching message: ' + msg.id);
			mailparser.end();  
	});
};

var fetchMailEnd = function () {
	console.log("fetching new emails complete.");
};

var saveMail = function(mail,id) {
		console.log("processing parsed mail: ");
		var procmail = {};
		if (mail.from[0].address) {
			procmail.from = mail.from[0].address.toLowerCase();
		}
    if (mail.to[0].address) {
    	procmail.to = mail.to[0].address.toLowerCase();
    }
    if (mail.subject) {
    	procmail.subject = mail.subject;
  	}
  	if (mail.headers.date) {
    	procmail.date = mail.headers.date;
    }
    if (mail.text) {
    	procmail.plaintext = mail.text;
    }
    if (mail.html) {
    	procmail.html = sanitizer.sanitize(mail.html);
    }
    if (mail.attachments) {
    	procmail.attachments = mail.attachments;
    }
		db.ticketFromEmail(procmail,function(err){
				if (err) {
					console.error("Unable to save mail " + id + " as ticket.");
				} else {
					console.log("Mail id " + id + " saved as ticket.");
					imapServer.addFlags(id, 'Seen', function(err) {
						if (err) {
							console.error("unable to mark msg" + id + "as read.");
						} else {
						console.log("Mail id " + id + " marked as read.");
						}
					});					
				}
		});
};

exports.ImapHandler = ImapHandler;




