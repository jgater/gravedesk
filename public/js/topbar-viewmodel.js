// view model
function TopBarViewModel() {
	// associated Data
	var self = this; //using self avoids scope problems with methods
	self.navbarLinks = [{"path":"/", "name": "Home", "icon":"icon-home", "showOnlyToAdmin": false}
	, {"path":"/manage", "name":"Manage Tickets", "icon":"icon-th-list", "showOnlyToAdmin": false}
	, {"path":"/admin", "name":"Admin Site", "icon":"icon-cog", "showOnlyToAdmin": true}
	, {"path":"/account", "name":" My Account", "icon":"icon-user", "showOnlyToAdmin": false}
	];

	self.matchingPath = function (linkpath) {
		var locationpath = location.pathname.substring(0,location.href.indexOf("/")+1);
		return (linkpath == location.pathname || linkpath == locationpath);
	};

};

ko.bindingHandlers['class'] = {
    'update': function(element, valueAccessor) {
        if (element['__ko__previousClassValue__']) {
            $(element).removeClass(element['__ko__previousClassValue__']);
        }
        var value = ko.utils.unwrapObservable(valueAccessor());
        $(element).addClass(value);
        element['__ko__previousClassValue__'] = value;
    }
};


