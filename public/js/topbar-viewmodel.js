// view model
function TopBarViewModel() {
	// associated Data
	var self = this; //using self avoids scope problems with methods
	self.matchingPath = function (linkpath) {
		var locationpath = location.pathname.substring(0,location.href.indexOf("/")+1);
		return (linkpath == location.pathname || linkpath == locationpath);
	};
};




