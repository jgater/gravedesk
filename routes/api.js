 var settings = require('../settings');

var TicketProvider = require('../lib/dbhandler').TicketProvider;
var ticket = new TicketProvider();


/*
api.js routes
*/

module.exports = {

  //app.get('/api'...
  index: function (req, res) {
    res.send('API is available.');
  },

  // POST to CREATE
  //app.post('/api/tickets'...
  postTicket: function (req, res) {
    console.log("POST: ");
    console.log(req.body);
  },

  // PUT to UPDATE
  //app.put('/api/tickets/:id'...
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
  getAll: function (req, res) {
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
  getCount: function (req, res) {
    ticket.findCountByStatus(req.params.status,function(err,count){
      if (count || count===0) {
        res.send(JSON.stringify(count)); 
      } else {
        res.send(JSON.stringify(-1));
      } 
    }); 
  },
  //get ticket summaries by status
  getStatus: function (req, res) {
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
  getId: function (req, res) {
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
  delTicket: function (req, res) {
    ticket.deleteById(req.params.id, function(err){
      if (err) {
        console.error("unable to delete ticket "+req.params.id+err);
      } else {
        res.send("destroyed ticket id: " + req.params.id);
      }
    });
  }

};