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

  //app.get('/manage'...
  manage: function(req, res){
    res.render('manage/index.jade', { title: 'Manage Tickets - '+settings.brand, brand: settings.brand });
  },

  // app.get('/admin'...)
  getAdmin: function(req, res) {
    res.render('admin/index.jade', { title: 'Admin - '+settings.brand, brand: settings.brand });
  },

  // app.get('/admin/register'...)
  getRegister: function(req, res){
    res.render('admin/register.jade', { title: 'Register User - '+settings.brand, brand: settings.brand });
  },

  // app.get('/admin/login', ...
  adminLogin: function(req, res) {
    res.render('admin/login.jade', { title: 'Admin login - '+settings.brand, brand: settings.brand });
  },

  // app.get('/account', ensureAuthenticated, ...
  getAccount: function(req, res) {
    res.render('account/index.jade', { title: 'Account - '+settings.brand, brand: settings.brand, currentUser: req.user });
  },

  // app.get('/logout'...)
  logout: function(req, res){
    req.logout();
    res.redirect('/');
  }

};
