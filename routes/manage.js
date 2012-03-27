var settings = require('../settings');

/*
manage.js routes
*/

module.exports = {

  //app.get('/manage'...
  index: function(req, res){
    res.render('manage/index.jade', { title: 'Manage Tickets - '+settings.brand, brand: settings.brand });
  },

  //app.get('/manage/:id'...
  id: function(req, res){
    res.render('manage/id.jade', { title: 'Manage Ticket - '+settings.brand, brand: settings.brand });
  }

};