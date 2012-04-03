/*
 * Module dependencies.
 */
var express = require('express');
var nowjs = require('now');
var async = require('async');
var util = require('util');
var ImapHandler = require('./lib/emailhandler').ImapHandler;
var sendMail = require('./lib/emailhandler').sendMail;
var dbhandler = require('./lib/dbhandler');
var passport = require('passport');
var settings = require('./settings');
var events = require('events');


var imap = new ImapHandler();
var db = new dbhandler.DB();
var ticketdb = dbhandler.TicketProvider;
var userdb = dbhandler.UserProvider;
var app = module.exports = express.createServer();

// Configuration

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.cookieParser());
  app.use(express.bodyParser());
  app.use(express.session({ secret: 'tom thumb' }));
  app.use(passport.initialize());
  app.use(passport.session());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
  app.set('view options', { pretty: true });
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
  app.use(express.errorHandler());
});

// Routes
require('./routes')(app);

//start services
async.series([
  //connect to db
  db.connectDB,
  function(callback) {
    // add default website admin user to db 
    userdb.saveOrReplaceUser(settings.defaultAdmin,callback);
  },
  // fire up web server
  function(callback) {
    app.listen(3000,callback);
    console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
  },
  //start imap
  imap.startMonitoring,
],
//callback error handler
function(err) {
  if (err) { console.error("Problem with starting background services; "+err); }
});

// initialize now.js
var everyone = nowjs.initialize(app);
console.log("now.js added to server app.");

// now functions    
everyone.now.getManageStartupData = function(callback){
  ticketdb.countAllByStatus(function(err,ticketcount){
    if (err) {console.error("Could not get ticket counts; ");}
    else {
      callback(ticketcount,settings.statusList);
    }
  });
};

everyone.now.postNewAdminAccount = function(newAdminAccount,callback){
  userdb.saveUser(newAdminAccount,callback);
};

everyone.now.getAdminStartupData = function(callback){
  callback(settings);
};

everyone.now.getAdminUsers = function(callback){
  userdb.findAllUsers(function(err,allusers){
    if (err) {console.error("Could not get all user accounts; ");}
    else { callback(allusers);}
  });
};

everyone.now.deleteAdminUser = function(user,callback){
  userdb.deleteUser(user,callback);
};

everyone.now.sendMail = function(mail,callback){
  sendMail(mail,callback);
};

//when db updates a ticket, trigger this event and tell the client to update tab ticket counts
ticketdb.on("ticketUpdated", function(){
  ticketdb.countAllByStatus(function(err,ticketcount){
    if (err) {console.error("Could not get ticket counts; ");}
      else { if (everyone.now.ticketUpdate) everyone.now.ticketUpdate(ticketcount); }
  });
});

// when db adds a new ticket from email, trigger this event and tell the client to update their table view 
ticketdb.on("ticketListChange", function(){
  ticketdb.countAllByStatus(function(err,ticketcount){
    if (err) {console.error("Could not get ticket counts; ");}
    else {if (everyone.now.newTicket) {everyone.now.newTicket(ticketcount);} }
  });
});











