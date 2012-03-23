/* static pages only */

/*
GET home page.
 */
exports.index = function(req, res){
  res.render('index', { title: 'Clayesmore IT Helpdesk' })
};

exports.manage = function(req, res){
  res.render('manage', { title: 'Manage Helpdesk' })
};