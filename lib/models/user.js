/*
User Schema user.js
*/
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var mongooseTypes = require("mongoose-types");
mongooseTypes.loadTypes(mongoose, "email");
var Email = mongoose.SchemaTypes.Email;
var passport = require('passport');
var bcrypt = require('bcrypt');

// Define schema
var UserSchema = new Schema({
    username: { type: String, index: { unique: true, dropDups: true } }
  , name : { 
        first: { type: String, required: true } 
      , last: { type: String, required: true }
    }
  , email: { type: Email, required: true }
  , salt: { type: String, required: true }
  , hash: { type: String, required: true }
});

UserSchema
.virtual('password')
.get(function () {
  return this._password;
})
.set(function (password) {
  this._password = password;
  var salt = this.salt = bcrypt.genSaltSync(10);
  this.hash = bcrypt.hashSync(password, salt);
});

UserSchema.method('verifyPassword', function(password, callback) {
  bcrypt.compare(password, this.hash, callback);
});

UserSchema.static('authenticate', function(username, password, callback) {
  this.findOne({ username: username }, function(err, user) {
      if (err) { return callback(err); }
      if (!user) { return callback(null, false); }
      user.verifyPassword(password, function(err, passwordCorrect) {
        if (err) { return callback(err); }
        if (!passwordCorrect) { return callback(null, false); }
        return callback(null, user);
      });
    });
});

module.exports = mongoose.model('User', UserSchema);