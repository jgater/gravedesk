/*
 * Module dependencies.
 */

var express = require('express');
var nowjs = require('now');
var async = require('async');
var util = require('util');
var ImapHandler = require('./lib/emailhandler').ImapHandler;
var DB = require('./lib/dbhandler').DB;
var TicketProvider = require('./lib/dbhandler').TicketProvider;
var passport = require('passport');
var settings = require('./settings');

var imap = new ImapHandler();
var db = new DB();
var ticket = new TicketProvider();
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
global.everyone = everyone;

// now functions    
everyone.now.getManageStartupData = function(callback){
  ticket.countAllByStatus(function(err,ticketcount){
    if (err) {console.error("Could not get ticket counts; ");}
    else {
      callback(ticketcount,settings.statusList);
    }
  });
};

//everyone.now.notify(newdata);  

