 var settings = require('../settings');


var dbhandler = require('../lib/dbhandler');
var ticketdb = dbhandler.TicketProvider;
var userdb = dbhandler.UserProvider;

/*
api.js routes
*/

module.exports = {

  // tickets RESTful api

  //app.get('/api', api.index);
  index: function (req, res) {
    res.send('API is available.');
  },

  // POST to CREATE
  //app.post('/api/tickets', api.postTicket);
  postTicket: function (req, res) {
    console.log("POST: ");
    console.log(req.body);
  },

  // PUT to UPDATE
  //app.put('/api/tickets/:id', api.putTicket);
  putTicket: function (req, res) {
    ticketdb.updateTicketById(req.params.id, req.body, function (err, num) {
      if (!err) {
        res.send("Changes to ticket " + req.params.id+" saved to database.");
      } 
    });
  },

  // GET to READ
  //get all tickets
  //app.get('/api/tickets', api.getTicketAll);
  getTicketAll: function (req, res) {
    ticketdb.findAll(function(err,tickets){
      if (tickets) {
        res.send(tickets);
      } else {
        console.error(err);
        res.send();
      }
    });
  },
  //get ticket summaries by status
  //app.get('/api/tickets/status/:status', api.getTicketStatus);
  getTicketStatus: function (req, res) {
    ticketdb.findByStatus(req.params.status, function(err,ticket){
      if (ticket) {
        res.send(ticket);
      } else {
        console.error(err);
        res.send();
      }
    });
  },
  //get ticket details by id
  //app.get('/api/tickets/:id', api.getTicketId);
  getTicketId: function (req, res) {
    ticketdb.findById(req.params.id,function(err,ticket){
      if (ticket) {
        res.send(ticket); 
      } else {
        console.error("ticket not found;" + err);
        res.send();
      } 
    }); 
  },

  // DELETE to DESTROY
  //app.delete('/api/tickets/:id', api.delTicketId);
  delTicketId: function (req, res) {
    ticketdb.deleteById(req.params.id, function(err){
      if (err) {
        console.error("unable to delete ticket "+req.params.id+err);
      } else {
        res.send("destroyed ticket id: " + req.params.id);
      }
    });
  },

  // admin users RESTful api

  // POST to CREATE
  //app.post('/api/adminuser', api.postUser);
  postUser: function(req, res) {
    userdb.saveUser({
      username: req.param('username')
    , fname : req.param('name.first')
    , lname : req.param('name.last')
    , email : req.param('email')
    , password : req.param('password')
    }, function(err,docs) {
        if (err) { res.render('admin/err.jade', { title: 'Admin Error - '+settings.brand, brand: settings.brand, err: err });
      } else {
        res.redirect('/admin');  
      }
    });
  },

  // PUT to UPDATE
  //app.put('/api/adminuser/:id', api.putUser);
  putUser: function(req, res) {
    res.send("PUT update user " + req.params.id);
  },
  // GET to READ
  //get all users
  //app.get('/api/adminuser', api.getUserAll);
  getUserAll: function(req, res) {
    res.send("GET all users");
  },
  //get user details by id
  //app.get('/api/adminuser/:id', api.getUserId);
  getUserId: function(req,res) {
    res.send("GET user data for user " + req.params.id)
  },
  // DELETE to DESTROY
  //app.delete('/api/adminuser/:id', api.delUserId);
  delUserId: function(req,res) {
    res.send("DEL user " + req.params.id)
  },

};