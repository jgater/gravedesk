// view model
function TopBarViewModel() {
	// associated Data
	var self = this; //using self avoids scope problems with methods
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


