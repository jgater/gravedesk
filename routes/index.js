/* static pages only */
var settings = require('../settings');
/*
GET home page.
 */
exports.index = function(req, res){
  res.render('index', { title: settings.brand, brand: settings.brand })
};

exports.manage = function(req, res){
  res.render('manage/index', { title: 'Manage Tickets - '+settings.brand, brand: settings.brand })
};

exports.manageid = function(req, res){
  res.render('manage/id', { title: 'Manage Ticket - '+settings.brand, brand: settings.brand })
};