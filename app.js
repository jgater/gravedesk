/*
 * Module dependencies.
 */

var express = require('express');
var nowjs = require('now');
var async = require('async');
var util = require('util');
var ImapHandler = require('./lib/emailhandler').ImapHandler;
var TicketProvider = require('./lib/dbhandler').TicketProvider;

var imap = new ImapHandler();
var db = new TicketProvider();
var app = module.exports = express.createServer();

// Configuration

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
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
var routes = require('./routes');
app.get('/', routes.index);
app.get('/manage', routes.manage);
app.get('/manage/:id', routes.manageid);


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

// now functions    

everyone.now.distributeMessage = function(message){
  everyone.now.receiveMessage(this.now.name, message);
};



// REST api

app.get('/api', function (req, res) {
  res.send('API is available.');
});

// POST to CREATE
app.post('/api/tickets', function (req, res) {
  console.log("POST: ");
  console.log(req.body);
});

// PUT to UPDATE
app.put('/api/tickets/:id', function (req, res) {
  console.log("PUT for " + req.params.id + " received.");
  db.updateTicketById(req.params.id, req.body, function (err, num) {
    if (!err) {
      res.send("Changes to ticket " + req.params.id+" saved to database.");
      console.log("Changes to ticket " + req.params.id+" saved to database.");
    } 
  });
});

// GET to READ
//get all tickets
app.get('/api/tickets', function (req, res) {
  db.findAll(function(err,tickets){
    if (tickets) {
      res.send(tickets);
    } else {
      console.error(err);
      res.send();
    }
  });
});

//get ticket count by status
app.get('/api/tickets/count/:status', function (req, res) {
  db.findCountByStatus(req.params.status,function(err,count){
    if (count || count===0) {
      res.send(JSON.stringify(count)); 
    } else {
      res.send(JSON.stringify(-1));
    } 
  }); 
});

//get ticket summaries by status
app.get('/api/tickets/status/:status', function (req, res) {
  db.findByStatus(req.params.status, function(err,ticket){
    if (ticket) {
      res.send(ticket);
    } else {
      console.error(err);
      res.send();
    }
  });
});

//get ticket details by id
app.get('/api/tickets/:id', function (req, res) {
  db.findById(req.params.id,function(err,ticket){
    if (ticket) {
      res.send(ticket); 
    } else {
      console.error("ticket not found;" + err);
      res.send();
    } 
  }); 
});


// DELETE to DESTROY
app.delete('/api/tickets/:id', function (req, res) {
  console.log("destroy ticket id: " + req.params.id);
});




