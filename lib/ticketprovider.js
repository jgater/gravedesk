// db setup requirements
var async = require('async');
var settings = require('../settings');
var events = require('events');
var fs = require('fs');
var path = require('path');
var rimraf = require('rimraf');

// model dependency

var ticketmodel = require('./models/ticket');


/*
ticketprovider functions
*/

var TicketProvider = function() {
	// count all tickets by status, provide object back suitable for injection mapping into knockout.js
	this.countAllByStatus = function(callback) {
		var iterator = function(status,cb){
			ticketmodel.count({'status': status}, cb)
		};
		var statuslist = settings.statusList;
		async.map(statuslist, iterator, function(err,counts){
			if (!err) {
				statusObject = {};
				for (i in settings.statusList) {
					statusObject[settings.statusList[i]] = counts[i];
				}
				callback(null,statusObject);
			} else {
				console.error(err);
			}
		});
	},
	// find all tickets
	this.findAll = function(callback) {
		ticketmodel.find({}, callback);
	},
	// find limited fields by status
	this.findByStatus = function(status,callback) {
				ticketmodel.find({'status': status}, ['_id', 'from', 'subject', 'date', 'impact', 'lastmodified'], callback);
	},
	
	//Find ticket by ID
	this.findById = function(id, callback) {
		ticketmodel.findById(id, function(err,ticket){
			if(err || ticket===null){
				callback(err);
			} else {
					callback(null,ticket);
			}
		});
	},
	
	//Delete ticket by ID
	this.deleteById = function(id, callback) {
		var self = this;
		async.waterfall([
			function(callback) {
				ticketmodel.findById(id, callback);
			},
			function(doc,callback) {
				doc.remove(function(){
					self.emit('ticketListChange');
					self.deleteAttachments(id,callback);
				});
			}
		], callback);
	},
		
	//Create a ticket from email
	this.ticketFromEmail = function(params, callback) {
		var self=this;
		// check if email already has an ID - if so, add to existing ticket, else send to be a new email
		if (params.subject) {
			var searchstring = params.subject.match(/\<[a-z|A-Z|0-9]*\>/g);
		} else {
			searchstring = null;
		}
    if (searchstring) {
        // ahah, we have a potential <ID> in the subject
        // remove first and last character from string, use last match
        var substring = searchstring.pop().slice(1,-1);
        // test if is a valid ticket ID
        ticketmodel.findById(substring,function(err,result){
        	if (err) {
        		// no ticket by that ID found - could be < > false positive (mailing lists), create new ticket.
        		self.newTicket(params,callback);

        	} else if (result && result.status != "Closed") {
        		// found a ticket matching the subject ID that isn't closed
        		//replace email subject with ticket subject
        		params.subject = "RE:" + result.subject;
        		// add email to existing ticket

						var attachments = params.attachments.splice(0,params.attachments.length);
						var index = result.emails.length;

						self.attachmentStubs(attachments,index,function(err,stubs){
							if (!err) {
								params.attachments = stubs;
        				result.emails.push(params);
        				self.updateTicketEmailsById(result._id, result, function(err,num){
        					if (err) {
        						console.error("Could not add new email to existing ticket: " + err);
        						callback(err);
        					} else {
        						//now we have the saved ticket, we can save the attachments
										console.log("here we save "+attachments.length+" attachments to disk, with ticket id "+result._id);
										self.saveAttachments(attachments,index,result._id);
        						callback(null, result, false);

        					}
        				});
        			}
        		});

        	} else {
        		// ticket by that ID found, but it's closed. Do new ticket.
        		self.newTicket(params,callback);
        	}
        });
    } else {
    		// ticket id format not found in subject, create a new ticket.
        self.newTicket(params,callback);
    }
  },


  // internal function!!
  this.newTicket = function(params,callback) {
  	var self=this;
		var attachments = params.attachments.splice(0,params.attachments.length);
		self.attachmentStubs(attachments,0,function(err,stubs){
			if (!err) {
				var ticket = new ticketmodel();
				params.attachments = stubs;
				ticket.emails.push(params);
				ticket.date = params.date;
				ticket.lastmodified = params.date;
				ticket.from = params.from || settings.blankticket.from;
				// search and remove strings of pattern "- text - ID: <text>", i.e. previous autoreplies
				if (params.subject) {
					cleansubject = params.subject.replace(/\- [a-z|A-Z]* \- ID: \<[a-z|A-Z|0-9]*\>/g, "");
				} else {
					cleansubject = null;
				}
				ticket.subject = cleansubject || settings.blankticket.subject;
				ticket.description = params.html || params.plaintext || settings.blankticket.description;    
				ticket.status = params.status || settings.blankticket.status;
				ticket.impact = settings.blankticket.impact;
				ticket.save(function(err,doc){
					if (err) {callback(err);
					} else {
						self.emit('ticketListChange');
						//now we have the saved ticket id, we can save the attachments
						console.log("here we save "+attachments.length+" attachments to disk, with ticket id "+doc._id);
						self.saveAttachments(attachments,0,doc._id);
						//we send the ticket back to the callback, so a reply can be built from it
						callback(null, doc, true);
					}
				});
			} else {
				callback(err);
			}
		});
	},

	// internal function!!
	this.attachmentStubs = function(attachments,index,callback) {
		var date = new Date();
		var iterator = function(item,cb){
				if (item.transferEncoding == 'base64') {
					var stub = {};
					stub.date = date;
					stub.fileName = encodeURIComponent(index+"_"+item.fileName);
					stub.contentType = item.contentType;
					cb(null,stub);
				} else {
					cb(null,null);
				}
		};
		async.map(attachments, iterator, function(err,results){
			if (err) {
				console.log("error parsing attachments; " + err);
				callback(err);
			}
			else {
				// need to clean non file stubs nulls from results
				var iterator = function(item,cb){
					if(item){ cb(true);}
					else {cb(false);}
				};
				async.filter(results, iterator, function(results){
					callback(null,results);
				});
			}
		});
	},

	// internal function!!
	this.saveAttachments = function(attachments,index,id) {
		id = id+'';
		index = index+'';
		if ( !fs.existsSync(settings.attachmentDir) ) fs.mkdirSync(settings.attachmentDir);
		if ( !fs.existsSync(path.join(settings.attachmentDir, id) ) ) fs.mkdirSync(path.join(settings.attachmentDir,id));
			var iterator = function(item,callback){
				if (item.transferEncoding == 'base64') {
					var base64Data = item.content;
					var dataBuffer = new Buffer(base64Data, 'base64');
					var filePath = path.join(settings.attachmentDir, id, index+"_"+item.fileName);	
					fs.writeFileSync(filePath, dataBuffer, callback);
				} else {
					callback(null);
				}
			};

			async.forEachSeries(attachments,iterator,function(err){
				if (err) {
					console.log(err);
				}
			});
	},

	// internal function
	this.deleteAttachments = function(id,callback) {
		var path = 'attachments/'+id;
		rimraf(path, callback);
	}

	this.updateTicketEmailsById = function(id, ticket, callback) {
		var self = this;
		var conditions = {_id : id };
		var update = { emails: ticket.emails, lastmodified: new Date() };
		var options = {};
		ticketmodel.update(conditions, update, options, function(err,numAffected){
			if (err) {callback(err);}
			else {
				self.emit('ticketUpdated');
				callback(null,numAffected);
			}
		});
	}

	this.updateTicketById = function(id, ticket, callback) {
		var self = this;
		var conditions = {_id : id };
		var update = { status: ticket.status, impact: ticket.impact, lastmodified: new Date(), from: ticket.from, subject: ticket.subject, description: ticket.description };
		var options = {};
		ticketmodel.update(conditions, update, options, function(err,numAffected){
			if (err) {callback(err);}
			else {
				self.emit('ticketUpdated');
				callback(null,numAffected);
			}
		});
	}

};

TicketProvider.prototype = new events.EventEmitter;
module.exports = new TicketProvider();



