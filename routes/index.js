var settings = require('../settings');

/*
index.js routes
*/

module.exports = {

  // app.get('/'...)
  index: function(req, res) {
  	res.render('index.jade', { title: settings.brand, brand: settings.brand });
	},

  // app.get('/register'...)
  getRegister: function(req, res) {
    res.render('register/index.jade');
  },

  // app.post('/register'...)
  postRegister: function(req, res) {
    db.saveUser({
       name : req.param('username')
    , email : req.param('email')
    , password : req.param('password')
    }, function(err,docs) {
      res.redirect('/account');
    });
  },

  // app.get('/login', ...
  login: function(req, res) {
    res.render('login/index.jade');
  },

  // app.get('/account', ensureAuthenticated, ...
  getAccount: function(req, res) {
    res.render('account/index.jade');
  },

  // app.get('/logout'...)
  logout: function(req, res){
    req.logout();
    res.redirect('/');
  }

};
