/* routes.js
  */

var passport = require('passport');

var start = require('./routes/index');
var manage = require('./routes/manage');
var api = require('./routes/api');

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) { return next(); }
  res.redirect('/login');
}

module.exports = function(app) {
  
  app.get('/', start.index);
  app.get('/register', start.getRegister);
  app.post('/register', start.postRegister);
  app.get('/login', start.login);
  app.post('/login', passport.authenticate('local', 
    { 
      successRedirect: '/account', 
      failureRedirect: '/login'
    })
  );

  app.get('/manage', manage.index);
  app.get('/manage/:id', manage.id);


  // REST api
  app.get('/api', api.index);
  // POST to CREATE
  app.post('/api/tickets', api.postTicket);
  // PUT to UPDATE
  app.put('/api/tickets/:id', api.putTicket);
  // GET to READ
  //get all tickets
  app.get('/api/tickets', api.getAll);
  //get ticket count by status
  app.get('/api/tickets/count/:status', api.getCount);
  //get ticket summaries by status
  app.get('/api/tickets/status/:status', api.getStatus);
  //get ticket details by id
  app.get('/api/tickets/:id', api.getId);
  // DELETE to DESTROY
  app.delete('/api/tickets/:id', api.delTicket);


/*
  app.get('/account', ensureAuthenticated, start.getAccount);
  app.get('/logout', start.logout);
*/  
}