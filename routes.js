/* routes.js
  */

var passport = require('passport');

var start = require('./routes/start');
var api = require('./routes/api');

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) { return next(); }
  res.redirect('/admin/login');
}

module.exports = function(app) {
  
  // standard pages
  app.get('/', start.index);
  app.get('/admin', start.getAdmin);  
  app.get('/admin/register', start.getRegister);
  app.get('/admin/login', start.adminLogin);
  app.post('/admin/login', passport.authenticate('local', 
    { 
      successRedirect: '/account', 
      failureRedirect: '/admin/login'
    })
  );
  app.get('/account', ensureAuthenticated, start.getAccount);
  app.get('/logout', start.logout);

  // manage tickets pages
  app.get('/manage', start.manage);


  // tickets RESTful api
  app.get('/api', api.index);
  // POST to CREATE
  app.post('/api/tickets', api.postTicket);
  // PUT to UPDATE
  app.put('/api/tickets/:id', api.putTicket);
  // GET to READ
  //get all tickets
  app.get('/api/tickets', api.getTicketAll);
  //get ticket count by status
  app.get('/api/tickets/count/:status', api.getTicketCount);
  //get ticket summaries by status
  app.get('/api/tickets/status/:status', api.getTicketStatus);
  //get ticket details by id
  app.get('/api/tickets/:id', api.getTicketId);
  // DELETE to DESTROY
  app.delete('/api/tickets/:id', api.delTicketId);


  // admin users RESTful api
  // POST to CREATE
  app.post('/api/adminuser', api.postUser);
  // PUT to UPDATE
  app.put('/api/adminuser/:id', api.putUser);
  // GET to READ
  //get all users
  app.get('/api/adminuser', api.getUserAll);
  //get user details by id
  app.get('/api/adminuser/:id', api.getUserId);
  // DELETE to DESTROY
  app.delete('/api/adminuser/:id', api.delUserId);


}