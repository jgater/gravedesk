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
  			ticketmodel.find({'status': status}, ['_id', 'from', 'subject', 'date', 'impact'], callback);
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
  	
  //Create a new ticket from email
  this.ticketFromEmail = function(params, callback) {
    var self=this;
  	var ticket = new ticketmodel();
  	ticket.emails.push(params);
  	ticket.date = params.date;
  	ticket.from = params.from || settings.blankticket.from;
  	ticket.subject = params.subject || settings.blankticket.subject;
  	ticket.description = params.html || params.plaintext || settings.blankticket.description;    
  	ticket.status = params.status || settings.blankticket.status;
    ticket.save(function(err){
      if (err) {callback(err);
      } else {
        self.emit('ticketListChange');
        callback(null);
      }
    });
  },

  this.updateTicketById = function(id, ticket, callback) {
    var self = this;
    var conditions = {_id : id };
    var update = { status: ticket.status, impact: ticket.impact };
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
  }

};

exports.UserProvider = new UserProvider();


