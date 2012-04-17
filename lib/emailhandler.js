
// imap email retrieve setup

var MailParser = require('mailparser').MailParser;
var util = require('util');
var async = require('async');
var settings = require('../settings');
var imap = require('imap');
var TicketProvider = require('./dbhandler').TicketProvider;
var ticketdb = TicketProvider;
var sanitizer = require('sanitizer');
var nodemailer = require("nodemailer");

var imapServer = new imap.ImapConnection({
		username: settings.imap.username,
		password: settings.imap.password,
		host: settings.imap.host,
		port: settings.imap.port,
		secure: settings.imap.secure
});

var alreadyFetching = false;
var alreadyConnected = false;

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
			alreadyConnected = false;
			alreadyFetching = false;
			connectAndFetch(function(err){
				if (err) {console.error(err);}
			});	
		});
		// listen for flag changes on inbox; then fetch.
		imapServer.on( "msgupdate", function() {
			justFetch(function(err){
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
	if (!alreadyFetching) {
		nowFetching(callback);
	} else {
		console.log("Already fetching email.");
		setTimeout(function(){
			// wait 10 seconds and check again
			justFetch(callback);
		}, (10*1000) );																																	
	}
};

var nowFetching = function(callback) {
	alreadyFetching = true;	
		async.waterfall([
			openInbox,
			searchInbox,
			fetchInboxMail,	
		],callback);
	};

var connectIMAP = function (callback) {
	// To keep things tidy, close (and auto-reopen) connection after 25 minutes
	setTimeout(function(){ 
			imapServer.logout();
		}, (25*60*1000) );
	console.log("Connnecting to IMAP server;");
		if (!alreadyConnected) {
			//mail server not connected; start a fresh connection.
			imapServer.connect(function(err){
				if (err) { 
					console.error("Failure to connect to IMAP server; " + err);
					callback(err);
				} else {
					console.log("IMAP server connected OK.");
					alreadyConnected = true;
					callback(null);
				}
			});
		} else {
			console.log("IMAP connection already open; moving on.");
			callback(null);
		}
};

var openInbox = function(callback) {
	console.log("Opening "+settings.imap.box + " mailbox.");
	imapServer.openBox(settings.imap.box, callback);
};
var searchInbox = function(box,callback) {
		console.log("Searching "+box.name+ " for new emails.");
		imapServer.search([ 'UNSEEN' ], callback);
};
var fetchInboxMail = function(messages,callback) {	
		console.log("There are " + messages.length + " new emails.");
		alreadyFetching = false;	
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
	alreadyFetching = false;	
};

var saveMail = function(mail,id) {
		console.log("processing parsed mail: ");
		var procmail = {};
		procmail.date = new Date;
		if (mail.from[0].address) {
			procmail.from = mail.from[0].address.toLowerCase();
		}
    if (mail.to[0].address) {
    	procmail.to = mail.to[0].address.toLowerCase();
    }
    if (mail.subject) {
    	procmail.subject = mail.subject;
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
		ticketdb.ticketFromEmail(procmail,function(err,ticket){
				if (err) {
					console.error("Unable to save mail " + id + " as ticket.");
				} else {
					console.log("Mail id " + id + " saved as ticket.");
					imapServer.addFlags(id, 'Seen', function(err) {
						if (err) {
							console.error("unable to mark msg" + id + "as read.");
						} else {
						console.log("Mail id " + id + " marked as read.");
						// now mail has been marked as read on imap, we can now mail the sender safely with our autoresponse
						autoRespond(ticket);
						}
					});					
				}
		});
};

exports.ImapHandler = ImapHandler;

var autoRespond = function(ticket) {
	var mail = {};
	mail.to = ticket.from;
	mail.subject = "RE: " + ticket.subject + " - Accepted - ID: [" + ticket.id + "]";
	mail.html = "<p>Thank you for reporting this issue to the Clayesmore IT Support team. It has been accepted as a new job ticket, and we will look into it as soon as possible.</p><br><br><br><br><br><hr><small>Original description:</small><br><br>" + ticket.description;
	sendMail(mail,ticket.id,function(err,num){
		if (err) {
			console.error(err);
		}
	});
};



var sendMail = function(mail,id,cb){
	//connect to smtp server
	var smtpTransport = nodemailer.createTransport("SMTP",settings.smtp);
	mail.from = settings.smtpFrom;
	// add settings 'from' address, send mail
	smtpTransport.sendMail(mail, function(err, response){
		smtpTransport.close(); // shut down the connection pool, no more messages
    if(err){
        console.error(err);
        cb(err);
    } else {
        console.log("Email sent for ticket ID: "+ id + ", server response: " + response.message);
        // if mail sent successfully, find ticket by id and add sent mail to history
        // sanitize mail
        var procmail = {};
        procmail.from = mail.from;
        procmail.to = mail.to;
        procmail.date = new Date();
				procmail.html = mail.html;
				procmail.subject = mail.subject;

        ticketdb.findById(id, function(err,ticket) {
        		ticket.emails.push(procmail);
        		ticketdb.updateTicketById(id,ticket,cb);
        });
    }
    
  }); 
};

exports.sendMail = sendMail;









