// model dependency

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
		usermodel.find({}, "email name username", callback);
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

module.exports = new UserProvider();


