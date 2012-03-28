var settings = require('../settings');
var UserProvider = require('../lib/dbhandler').UserProvider;
var user = new UserProvider;

/*
index.js routes
*/

module.exports = {

  // app.get('/'...)
  index: function(req, res) {
  	res.render('index.jade', { title: settings.brand, brand: settings.brand });
	},

  // app.get('/admin'...)
  getAdmin: function(req, res) {
    res.render('admin/index.jade', { title: 'Admin - '+settings.brand, brand: settings.brand });
  },

  // app.get('/register'...)
  getRegister: function(req, res){
    res.render('admin/register.jade', { title: 'Register User - '+settings.brand, brand: settings.brand });
  },

  // app.post('/register'...)
  postRegister: function(req, res) {
    user.saveUser({
      fname : req.param('name.first')
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
