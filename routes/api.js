// modules
var path = require('path');
var util = require('util');
var crypto = require('crypto');
var fs = require('fs');
var settings = require('../settings');
var tickethandler = require('../lib').tickethandler;
var emailhandler = require('../lib/').emailhandler;
/*
api.js routes
*/

module.exports = {

	// tickets RESTful api

	//app.get('/api', api.index);
	index: function (req, res) {
		res.send('API is available.');
	},

	// POST to CREATE
	//app.post('/api/tickets', api.postTicket);
	postTicket: function (req, res) {
		console.log("POST: ");
		console.log(req.body);
	},

	// PUT to UPDATE
	//app.put('/api/tickets/:id', api.putTicket);
	putTicket: function (req, res) {
		tickethandler.updateById(req.params.id, req.body, function (err, num) {
			if (!err) {
				res.send("Changes to ticket " + req.params.id+" saved to database.");
			} 
		});
	},

	// GET to READ
	//get all tickets
	//app.get('/api/tickets', api.getTicketAll);
	getTicketAll: function (req, res) {
		tickethandler.findAll(function(err,tickets){
			if (tickets) {
				res.send(tickets);
			} else {
				console.error(err);
				res.send();
			}
		});
	},
	//get ticket summaries by status
	//app.get('/api/tickets/status/:status', api.getTicketStatus);
	getTicketStatus: function (req, res) {
		tickethandler.findByStatus(req.params.status, function(err,ticket){
			if (ticket) {
				res.send(ticket);
			} else {
				console.error(err);
				res.send();
			}
		});
	},
	// get attachment for a ticket
	//app.get('/api/tickets/:id/:attachment', api.getTicketAttachment);
	getTicketAttachment: function (req, res) {
		var filePath = path.join(settings.attachmentDir, req.params.id, decodeURIComponent(req.params.attachment));
		var stat = fs.statSync(filePath);
		res.writeHead(200, {
				'Content-Length': stat.size
		});

		var readStream = fs.createReadStream(filePath);
		util.pump(readStream, res);
	},
	//get ticket details by id
	//app.get('/api/tickets/:id', api.getTicketId);
	getTicketId: function (req, res) {
		tickethandler.findById(req.params.id,function(err,ticket){
			if (ticket) {
				res.send(ticket); 
			} else {
				console.error("ticket not found; " + err);
				res.send();
			} 
		}); 
	},

	// DELETE to DESTROY
	//app.delete('/api/tickets/:id', api.delTicketId);
	delTicketId: function (req, res) {
		tickethandler.deleteById(req.params.id, function(err){
			if (err) {
				console.error("unable to delete ticket "+req.params.id+err);
			} else {
				res.send("destroyed ticket id: " + req.params.id);
			}
		});
	},

	// email restful API

	// receive notice of new mail from contextio
	//app.post('/api/email/new', api.newEmail);
	postNewEmail: function (req, res) {
		var signer = crypto.createHmac('sha256', settings.contextio.secret);
		var expected = signer.update(req.body.timestamp + req.body.token).digest('hex');
		if (expected === req.body.signature) {
			// valid notice, retrieve message
			emailhandler.getMessage(req.body.message_data.message_id+"");
		};
		res.end();
	},

	// receive failure notice of webhook
	//app.post('/api/email/failed', api.failedEmail);
	postFailedEmail: function (req, res) {
		console.log("email retrieval failure: ");
		console.log(req.body);
		res.end();
	}




};