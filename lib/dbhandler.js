// db setup requirements
var async = require('async');
var mongoose = require('mongoose');
var settings = require('../settings');

// model dependency

var ticketmodel = require('./models/ticket');
var usermodel = require('./models/user');

// dependencies for authentication
var passport = require('passport')
  , LocalStrategy = require('passport-local').Strategy;

// Define local strategy for Passport
passport.use(new LocalStrategy({
    usernameField: 'email'
  },
  function(email, password, done) {
    usermodel.authenticate(email, password, function(err, user) {
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
  			ticketmodel.find({'status': status}, ['_id', 'from', 'subject', 'date', 'impact'], callback);
  },
  
  // find count of tickets by status
  this.findCountByStatus = function(status,callback) {
  			ticketmodel.count({'status': status}, callback);
  },
  
  //Find ticket by ID
  this.findById = function(id, callback) {
  	ticketmodel.findById(id, callback);
  },
  
  //Delete ticket by ID
  this.deleteById = function(id, callback) {
  	async.waterfall([
  		function(callback) {
  			ticketmodel.findById(id, callback);
  		},
  		function(doc,callback) {
  			doc.remove();
  			callback(null);
  		}
  	], callback);
  },
  	
  //Create a new ticket from email
  this.ticketFromEmail = function(params, callback) {
  	var ticket = new ticketmodel();
  	ticket.emails.push(params);
  	ticket.date = params.date;
  	ticket.from = params.from || settings.blankticket.from;
  	ticket.subject = params.subject || settings.blankticket.subject;
  	ticket.description = params.html || params.plaintext || settings.blankticket.description;    
  	ticket.status = params.status || settings.blankticket.status;
    ticket.save(callback);
  },
  
  this.updateTicketById = function(id, ticket, callback) {
  	var conditions = {_id : id };
  	var update = { status: ticket.status, impact: ticket.impact };
  	var options = {};
  	ticketmodel.update(conditions, update, options, callback);
  },
  
  
  this.addNoteToTicket = function(Id, note, callback) {
    this.findById(Id, function(err, ticket) {
      if(err){
  	  	callback(err);
  		} else {
  	  	ticket.notes.push(note);
  	  	ticket.save(callback);
      }
    });
  }

};
exports.TicketProvider = TicketProvider;

/*
User handler
*/

var UserProvider = function() {
	var self = this;

	// save a user
  this.saveUser = function(userInfo, callback) {
    //console.log(userInfo['fname']);
    var newUser = new usermodel ({
      name : { first: userInfo.fname, last: userInfo.lname }
    , email: userInfo.email
    , password: userInfo.password
    });
    console.log('Name: ' + newUser.name + '\nEmail: ' + newUser.email);
    usermodel.findOne({email: newUser.email }, function (err, doc){
    	if (doc) {
    		callback("Email address already in use.")
    	} else if (err) {
    		callback(err);
    	} 
    	else {
    		newUser.save(callback);
    	}
		});  
  }


};

exports.UserProvider = UserProvider;


