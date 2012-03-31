 var settings = require('../settings');

var TicketProvider = require('../lib/dbhandler').TicketProvider;
var ticket = new TicketProvider();
var UserProvider = require('../lib/dbhandler').UserProvider;
var user = new UserProvider;


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
    ticket.updateTicketById(req.params.id, req.body, function (err, num) {
      if (!err) {
        res.send("Changes to ticket " + req.params.id+" saved to database.");
        console.log("Changes to ticket " + req.params.id+" saved to database.");
      } 
    });
  },

  // GET to READ
  //get all tickets
  //app.get('/api/tickets', api.getTicketAll);
  getTicketAll: function (req, res) {
    ticket.findAll(function(err,tickets){
      if (tickets) {
        res.send(tickets);
      } else {
        console.error(err);
        res.send();
      }
    });
  },
  //get ticket count by status
  //app.get('/api/tickets/count/:status', api.getTicketCount);
  getTicketCount: function (req, res) {
    ticket.findCountByStatus(req.params.status,function(err,count){
      if (count || count===0) {
        res.send(JSON.stringify(count)); 
      } else {
        res.send(JSON.stringify(-1));
      } 
    }); 
  },
  //get ticket summaries by status
  //app.get('/api/tickets/status/:status', api.getTicketStatus);
  getTicketStatus: function (req, res) {
    ticket.findByStatus(req.params.status, function(err,ticket){
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
    ticket.findById(req.params.id,function(err,ticket){
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
    ticket.deleteById(req.params.id, function(err){
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
    user.saveUser({
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