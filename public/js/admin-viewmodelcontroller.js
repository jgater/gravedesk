function AdminViewModelController() {
	var self = this;
	// data
	self.topbarView = new TopBarViewModel();
	self.newAdminAccount = ko.validatedObservable({
    username : ko.observable().extend({ required: true }),
    password : ko.observable().extend({ required: true }),
    name: {
    	first: ko.observable().extend({ required: true }),
    	last: ko.observable().extend({ required: true })
    },
    email: ko.observable().extend({ email: "This" }),
    isAdmin: ko.observable(true).extend({ required: true })
	});
	// operations
	self.createAdmin = function(){
		now.postNewAdminAccount(ko.toJS(self.newAdminAccount),function(err){
			if (err) {alert(err);}
			else {alert("Account save successful.");}
		});
	};

}
