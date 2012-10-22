// db setup requirements
var mongoose = require('mongoose');

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
	},
	this.closeDB = function() {
		mongoose.disconnect();
	}
};
module.exports = new DB();

