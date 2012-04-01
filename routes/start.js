var settings = require('../settings');

/*
index.js routes
*/

module.exports = {

  // app.get('/'...)
  index: function(req, res) {
  	res.render('index.jade', { title: settings.brand, brand: settings.brand, currentUser: req.user });
	},

  //app.get('/manage'... ensureAuthenticated, ...
  manage: function(req, res){
    res.render('manage/index.jade', { title: 'Manage Tickets - '+settings.brand, brand: settings.brand, currentUser: req.user });
  },

  // app.get('/admin'...) ensureAuthenticated, ...
  getAdmin: function(req, res) {
    res.render('admin/index.jade', { title: 'Admin - '+settings.brand, brand: settings.brand, currentUser: req.user });
  },

  // app.get('/admin/register'...) ensureAuthenticated, ...
  getRegister: function(req, res){
    res.render('admin/register.jade', { title: 'Register User - '+settings.brand, brand: settings.brand, currentUser: req.user });
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
