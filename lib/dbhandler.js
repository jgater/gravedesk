// db setup requirements
var async = require('async');
var mongoose = require('mongoose');
var mongooseTypes = require("mongoose-types");
mongooseTypes.loadTypes(mongoose, "email");
var Email = mongoose.SchemaTypes.Email;
var settings = require('../settings');


/* Schema definition */

var Schema = mongoose.Schema;
var MailSchema = new Schema({
		from: Email
	,	to: Email
	,	subject: String
	,	date: Date
	,	plaintext: String
	,	html: String
	,	attachments : {}
});

var NoteSchema = new Schema({
		body: String 
	,	date: Date
	, by: String
});

var TicketSchema = new Schema({
		date: Date
	,	from: Email
	,	subject: String
	,	notes: [NoteSchema]
	,	emails: [MailSchema]
	,	attachments: {}
	,	description: String
	,	labels: {}
	,	impact: String
	,	status: String
	, cc: {}
});

//create db models
mongoose.model('Ticket', TicketSchema );
mongoose.model('Mail', MailSchema );
var ticketmodel = mongoose.model('Ticket');

var TicketProvider = function() {};

// connect to DB
TicketProvider.prototype.connectDB = function(callback) {
		console.log("Connecting to DB");
		mongoose.connect("mongodb://localhost:27017/gravedesk",function(err){
  		if(err){
  			console.log("DB connection failed; " + err);
	  		callback(err);
			} else {
				console.log("DB connection successful.");
				callback(null);
  		}
		});
}

// find all tickets
TicketProvider.prototype.findAll = function(callback) {
  ticketmodel.find({}, function(err, docs) {
  	if(err){
	  	callback(err);
		} else {
    callback(null, docs);
  	}
  });  
};
// find limited fields by status, sort and add age
TicketProvider.prototype.findByStatus = function(status,callback) {
			ticketmodel.find({'status': status}, ['_id', 'from', 'subject', 'date'], callback);
};

var sortByDate = function(ticket,callback){
	callback(null,ticket.date*-1);
}

//Find ticket by ID
TicketProvider.prototype.findTicketById = function(id, callback) {
	ticketmodel.findById(id, callback);
};
	
//Create a new ticket from email
TicketProvider.prototype.ticketFromEmail = function(params, callback) {
	var ticket = new ticketmodel();
	ticket.emails.push(params);
	ticket.date = params.date;
	ticket.from = params.from || settings.blankticket.from;
	ticket.subject = params.subject || settings.blankticket.subject;
	ticket.description = params.html || params.plaintext || settings.blankticket.description;    
	ticket.status = params.status || settings.blankticket.status;
  ticket.save(callback);
};

TicketProvider.prototype.updateTicketById = function(id, ticket, callback) {
};


TicketProvider.prototype.addNoteToTicket = function(Id, note, callback) {
  this.findById(Id, function(err, ticket) {
    if(err){
	  	callback(err);
		} else {
	  	ticket.notes.push(note);
	  	ticket.save(callback);
    }
  });
};

exports.TicketProvider = TicketProvider;


