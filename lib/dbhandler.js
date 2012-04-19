// db setup requirements
var async = require('async');
var mongoose = require('mongoose');
var settings = require('../settings');
var events = require('events');
var util = require('util');

// model dependency

var ticketmodel = require('./models/ticket');
var usermodel = require('./models/user');

// dependencies for authentication
var passport = require('passport')
	, LocalStrategy = require('passport-local').Strategy;

// Define local strategy for Passport
passport.use(new LocalStrategy({
		usernameField: 'username'
	},
	function(username, password, done) {
		usermodel.authenticate(username, password, function(err, user) {
			return done(err, user);
		});
	}
));

// serialize user on login
passport.serializeUser(function(user, done) {
	done(null, user.id);
});

// deserialize user on logout
passport.deserializeUser(function(id, done) {
	usermodel.findById(id, function (err, user) {
		done(err, user);
	});
});

// DB connection handler

var DB = function() {
	this.connectDB = function(callback) {
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
};
exports.DB = DB;

/*
tickethandler functions
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
		ticketmodel.find({}, function(err, docs) {
			if(err){
				callback(err);
			} else {
			callback(null, docs);
			}
		});  
	},
	// find limited fields by status
	this.findByStatus = function(status,callback) {
				ticketmodel.find({'status': status}, ['_id', 'from', 'subject', 'date', 'impact', 'lastmodified'], callback);
	},
	
	//Find ticket by ID
	this.findById = function(id, callback) {
		ticketmodel.findById(id, callback);
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
					callback(null);
				});
			}
		], callback);
	},
		
	//Create a ticket from email
	this.ticketFromEmail = function(params, callback) {
		var self=this;
		// check if email already has an ID - if so, add to existing ticket, else send to be a new email
		var searchstring = params.subject.match(/\[.*\]/g);
    if (searchstring) {
        // ahah, we have a potential [ID] in the subject
        // remove first and last character from string
        var substring = searchstring[0].slice(1,-1);
        // test if is a valid ticket ID
        ticketmodel.findById(substring,function(err,result){
        	if (err) {
        		// no ticket by that ID found - could be [] false positive (mailing lists), create new ticket.
        		self.newTicket(params,callback);
        	} else if (result && result.status != "Closed") {
        		// found a ticket matching the subject ID that isn't closed
        		//replace email subject with ticket subject
        		params.subject = "RE:" + result.subject;
        		// add email to existing ticket
        		result.emails.push(params);
        		self.updateTicketEmailsById(result._id, result, function(err,num){
        			if (err) {
        				console.error("Could not add new email to existing ticket: " + err);
        			} else {
        				callback(null, result, false);
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

  this.newTicket = function(params,callback) {
  	var self=this;
		var ticket = new ticketmodel();
		ticket.emails.push(params);
		ticket.date = params.date;
		ticket.lastmodified = params.date;
		ticket.from = params.from || settings.blankticket.from;
		ticket.subject = params.subject || settings.blankticket.subject;
		ticket.description = params.html || params.plaintext || settings.blankticket.description;    
		ticket.status = params.status || settings.blankticket.status;
		ticket.impact = settings.blankticket.impact;
		ticket.save(function(err,doc){
			if (err) {callback(err);
			} else {
				self.emit('ticketListChange');
				callback(null, doc, true);
			}
		});
	},

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
exports.TicketProvider = new TicketProvider();

/*
User handler
*/

var UserProvider = function() {
	var self = this;

	// save a user
	this.saveUser = function(userInfo,callback) {
		var newUser = new usermodel ({
			username: userInfo.username
		, name : { first: userInfo.name.first, last: userInfo.name.last }
		, email: userInfo.email
		, password: userInfo.password
		, isAdmin: userInfo.isAdmin
		});
		usermodel.findOne({username: newUser.username }, function (err, user){
			if (user) {
				callback("Username already in use.");
			} else if (err) {
				callback(err);
			} 
			else {
				newUser.save(callback);
			}
		});  
	},

	this.saveOrReplaceUser = function(userInfo, callback) {
		var newUser = new usermodel ({
			username: userInfo.username
		, name : { first: userInfo.fname, last: userInfo.lname }
		, email: userInfo.email
		, password: userInfo.password
		, isAdmin: userInfo.isAdmin
		});
		usermodel.findOne({username: newUser.username}, function(err, user) {
			if(!err) {
					if(!user) {
						newUser.save(callback);
					} else {
						user.remove();
						newUser.save(callback);        }
			} else {
				callback(err);
			}
		});
	},

	this.findAllUsers = function(callback) {
		usermodel.find({}, ['email', 'name', 'username'], callback);
	},

	this.deleteUser = function(user,callback) {
		usermodel.findOne({username: user.username }, function (err, user){
    	if (err) {
    		callback(err);
    	} else if (!user) {
    		callback("User not found.")
    	} else {
    		user.remove();
    		callback(null,"User deleted.");
    	}
		});  
	}
};

exports.UserProvider = new UserProvider();


