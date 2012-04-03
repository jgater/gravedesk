/* Schema definition */
var mongoose = require('mongoose');
var mongooseTypes = require("mongoose-types");
mongooseTypes.loadTypes(mongoose, "email");
var Email = mongoose.SchemaTypes.Email;

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
	,	from: String
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
module.exports = mongoose.model('Ticket', TicketSchema);