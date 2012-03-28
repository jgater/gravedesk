/* routes.js
  */

var passport = require('passport');

var start = require('./routes/start');
var manage = require('./routes/manage');
var api = require('./routes/api');

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) { return next(); }
  res.redirect('/admin/login');
}

module.exports = function(app) {
  
  // standard pages
  app.get('/', start.index);
  app.get('/admin', ensureAuthenticated, start.getAdmin);  
  app.get('/admin/register', ensureAuthenticated, start.getRegister);
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
  app.get('/manage', ensureAuthenticated, manage.index);
  app.get('/manage/:id', ensureAuthenticated, manage.id);


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
  app.post('/api/user', api.postUser);
  // PUT to UPDATE
  app.put('/api/user/:id', api.putUser);
  // GET to READ
  //get all users
  app.get('/api/user', api.getUserAll);
  //get user details by id
  app.get('/api/user/:id', api.getUserId);
  // DELETE to DESTROY
  app.delete('/api/user/:id', api.delUserId);


}