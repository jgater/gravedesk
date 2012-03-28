// view model
function TopBarViewModel() {
	// associated Data
	var self = this; //using self avoids scope problems with methods
	self.navbarLinks = [{"path":"/", "name": "Home"}, {"path":"/manage", "name":"Manage"}, {"path":"/admin", "name":"Admin"}];
	self.navLocation = ko.computed(function () {
		return location.pathname.substring(0,location.href.lastIndexOf("/")+1);
	});
};



