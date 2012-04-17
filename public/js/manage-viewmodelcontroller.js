//view model controller
function ManageViewModelController(ticketcount,statuslist) {
	var self = this;
	self.topbarView = new TopBarViewModel();
  self.tabsView = new tabsViewModel(ko.mapping.fromJS(ticketcount),statuslist);
	self.tableView = new tableViewModel();
	self.ticketView = new ticketViewModel();
	// respond to server command to update ticket views
	now.ticketUpdate = function(ticketcount){
		ko.mapping.fromJS(ticketcount,self.tabsView.tabcount);
		if (self.tableView.showTable) {self.tableView.getData( self.tabsView.chosenTabId() )}
		//probably not watching the same ticket that triggered the update, but update everyone's just in case
		if (self.ticketView.showTicket) {self.ticketView.getData( self.ticketView.ticketData()._id )}
	};
	//respond to server advising new ticket added to db
	now.newTicket = function(ticketcount){
		ko.mapping.fromJS(ticketcount,self.tabsView.tabcount);
		if (self.tableView.showTable) {self.tableView.getData( self.tabsView.chosenTabId() )}
	};

	Sammy(function() {
		this.get('/manage#/:ticketid', function (){
			self.tabsView.chosenTabId(null); //unselect all tabs
			self.tableView.showTable(false);
			self.ticketView.showTicket(true);
			self.ticketView.showMailForm(false);
			self.ticketView.getData(this.params.ticketid);
		});
		this.get('/manage#:tab', function() {
			self.ticketView.showTicket(false);
			self.tableView.showTable(true);
			self.ticketView.showMailForm(false);
			self.tabsView.chosenTabId(this.params.tab); //make the selected tab match the request
			self.tableView.getData(this.params.tab);
		});
		this.get('/manage', function() { this.app.runRoute('get', '/manage#'+self.tabsView.tabs[0]) }); //if no specific page requested, open the first tab view		
	}).run();

}

//-------------------------------

// view model
function tabsViewModel(tabcount,tabs) {
	// associated Data
	var self = this; //using self avoids scope problems with methods
	self.tabs = tabs;
	self.tabcount = tabcount;
	self.chosenTabId = ko.observable(); // remember, 'observables' are wrapper functions, not actual data structures per se.	
	// Operations
	// Client-side routing to allow for deeplinking/bookmarks - use sammy library to handle routing results
	self.goToTab = function(tab) { location.hash = tab };
};

//-------------------------------

// view model
function tableViewModel() {
	// associated Data
	var self = this; //using self avoids scope problems with methods
	self.tickets = ko.observableArray();
	self.showTable = ko.observable(false);
	// Operations
	self.sortByDate = function () {
		self.tickets.sort( function(left,right) { // sorts by date, newest first
					return (left.date === right.date) ? 0 : (left.date < right.date) ? 1 : -1;
		});
	};
	self.getData = function (status) {
			$.getJSON('/api/tickets/status/'+status, function(allData){ //get all tickets by status
				var mappedTickets = $.map(allData, function(item) { return new TicketSummary(item) } ); //return an array of processed(mapped) tickets
				self.tickets(mappedTickets); //put into tickets array (syntax like this because it's a function...)
				self.sortByDate();
			});
	};
};

//data model
function TicketSummary(rawticket) {
	this.id = rawticket._id;
	this.age = ko.observable( moment(rawticket.date).fromNow(true) );
	this.friendlydate = ko.observable( moment(rawticket.date).format('ddd MMM Do YYYY, HH:mm') );
	this.subject = rawticket.subject;
	this.from = rawticket.from;
	this.date = rawticket.date;
	this.impact = rawticket.impact || "normal";
}

//-------------------------------

//view model
function ticketViewModel() {
	// associated Data
	var self = this; //using self avoids scope problems with methods
	self.impacts = ko.observableArray(['High', 'Normal', 'Low']);
	self.ticketData = ko.observable();
	self.showTicket = ko.observable(false);
	self.showMailForm = ko.observable(false);
	self.mailForm = {
		to: ko.observable(),
		subject: ko.observable(),
		html: ko.observable()
	}
	self.isClosed = ko.computed( function() {
		if (!self.ticketData()) { return false; } 
		else if (self.ticketData().status() == "Closed") {return true;}
		else {return false;}	
	});
	// Operations
	self.reverseShowMail = function() {
		self.showMailForm( !self.showMailForm() );
	};

	self.writeMail = function() {
		//pull init data from ticketData
		var id = self.ticketData()._id;
		var from = self.ticketData().from;
		var sub = self.ticketData().subject;
		var description = self.ticketData().description;
		// pre-populate the form text fields
		self.mailForm.to(from);
		self.mailForm.subject("RE: " + sub + "  - ID: [" + id + "]");
		self.mailForm.html("<br><br><br><br><br><hr><small>Original description:</small><br><br>" + description);
		// reveal the form
		self.reverseShowMail();
	}

	self.sendMail = function() {
		now.sendMail(ko.toJS(self.mailForm),self.ticketData()._id,function(err){
			if (err) {
				alert("Error encountered sending email: " + JSON.stringify(err));
			} else {
				self.reverseShowMail();
				alert("email sent!");
			}
		});
	};

	self.getData = function(ticketId){
		$.getJSON('/api/tickets/'+ticketId, function(data){ //get ticket with _id of ticketId
				data.emails = $.map(data.emails, function(item) { return new Email(item) } );
				var koTicket = new incomingTicket(data);			 
				self.ticketData(koTicket);
		});
	};
	self.updateData = function(ticketId){
		var data = new outgoingTicket(ko.toJS(self.ticketData));
			$.ajax('/api/tickets/'+ticketId, {
        data: ko.toJSON(data),
        type: "PUT", contentType: "application/json",
        success: function(result) { 
        	console.log(result);
        }
    	});
	};
	self.deleteData = function(ticketId){
		$.ajax('/api/tickets/'+ticketId, {
            type: "DELETE", contentType: "application/json",
            success: function(result) {window.history.back(); }
        });
	};
	self.changeStatus = function(data) {
			self.ticketData().status(data);
			self.updateData(self.ticketData()._id);
	};
	self.closeTicket = function() {
		self.changeStatus("Closed");
	};
	self.deleteTicket = function() {
		self.deleteData(self.ticketData()._id);
	};
	self.changeImpact = function(data) {
		self.ticketData().impact(data);
		self.updateData(self.ticketData()._id);
	};
	
}

//data models

function incomingTicket(data) {
	this.age = moment(data.date).fromNow();
	this.friendlydate = moment(data.date).format('ddd MMM Do YYYY, HH:mm');
	this.subject = data.subject;
	this.from = data.from;
	this._id = data._id;
	this.status = ko.observable(data.status);
	this.description = data.description;
	this.notes = data.notes;
	this.emails = ko.observableArray(data.emails);
	this.impact = ko.observable(data.impact || "normal");
	this.cc = data.cc;
	this.labels = data.labels;
	this.attachments = ko.observableArray();
}

function Email(data) {
	this.from = data.from;
	this.to = data.to;
	this.subject = data.subject;
	if (data.date) {
		this.friendlydate = moment(data.date).format('ddd MMM Do YYYY, HH:mm');	
	} else {
		this.friendlydate = "no date set";
	}
	
	this.body = data.html || data.plaintext;
	this.show = ko.observable(false);
	this.attachments = data.attachments;
	this.reverseShow = function(){this.show( !this.show() )};
}

function outgoingTicket(data) {
	this.subject = data.subject;
	this.from = data.from;
	this._id = data._id;
	this.status = data.status;
	this.description = data.description;
	this.notes = data.notes;
	this.emails = data.emails;
	this.impact = data.impact;
	this.cc = data.cc;
	this.labels = data.labels;
}


ko.bindingHandlers.slideVisible = {
    update: function(element, valueAccessor, allBindingsAccessor) {
        // First get the latest data that we're bound to
        var value = valueAccessor(), allBindings = allBindingsAccessor();
         
        // Next, whether or not the supplied model property is observable, get its current value
        var valueUnwrapped = ko.utils.unwrapObservable(value); 
         
        // Grab some more data from another binding property
        var duration = allBindings.slideDuration || 200; // 400ms is default duration unless otherwise specified
         
        // Now manipulate the DOM element
        if (valueUnwrapped == true) 
            $(element).slideDown(duration); // Make the element visible
        else
            $(element).slideUp(duration);   // Make the element invisible
    }
};


