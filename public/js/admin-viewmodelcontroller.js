function AdminViewModelController(settings) {
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
	self.serverDefaults = settings;
	self.userList = ko.observableArray();
	// operations
	self.createAdmin = function(){
		now.postNewAdminAccount(ko.toJS(self.newAdminAccount),function(err){
			if (err) {alert(err);}
			else {alert("Account save successful.");}
		});
	};
	self.getUsers = function(){
		now.getAdminUsers(function(userList){
				var mappedUsers = $.map(userList, function(item) { return new incomingUser(item) } ); //return an array of processed(mapped) tickets
				self.userList(mappedUsers);
		});
	};
	self.deleteUser = function(user){
		now.deleteAdminUser(user,function(err,result){
			self.getUsers();
			if (err) { 
				alert(err);
			} else {
				alert(result);
			}
		});
	};

}

// data model
function incomingUser(data) {
	var self=this;
	this.email = data.email;
	this.name = {
    	first: data.name.first,
    	last: data.name.last
    };
  this.fullname = ko.computed(function(){
  	return self.name.first + " " + self.name.last;
  });
	this.username = data.username;
}
