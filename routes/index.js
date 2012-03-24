/* static pages only */

/*
GET home page.
 */
exports.index = function(req, res){
  res.render('index', { title: 'Clayesmore IT Helpdesk' })
};

exports.manage = function(req, res){
  res.render('manage/index', { title: 'Manage Helpdesk' })
};

exports.manageid = function(req, res){
  res.render('manage/id', { title: 'Manage Helpdesk' })
};