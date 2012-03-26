
// view model
function TicketViewModel() {
	// associated Data
	var self = this; //using self avoids scope problems with methods
	self.tabs = ko.observableArray(['Open', 'Pending', 'Longterm', 'Closed']);
	self.impacts = ko.observableArray(['High', 'Normal', 'Low']);
	self.chosenTabId = ko.observable(); // remember, 'observables' are wrapper functions, not actual data structures per se.
	self.ticketData = ko.observable();
	self.isClosed = ko.computed( function() {
		if (self.ticketData() == undefined) { return false; } 
		else if (self.ticketData()["status"]() == "Closed") {return true;}
		else {return false;}	
	});
	// Operations
	self.loadData = function(ticketId){
		$.getJSON('/api/tickets/'+ticketId, function(allData){ //get ticket with _id of ticketId
				self.ticketData(new incomingTicket(allData)); //put into ticketData
			});
	};
	self.updateData = function(ticketId){
		var data = new outgoingTicket(ko.toJS(self.ticketData));
		$.ajax('/api/tickets/'+ticketId, {
            data: ko.toJSON(data),
            type: "PUT", contentType: "application/json",
            success: function(result) { alert(result) }
        });
	};
	self.deleteData = function(ticketId){
		$.ajax('/api/tickets/'+ticketId, {
            type: "DELETE", contentType: "application/json",
            success: function(result) {location = '/manage'; }
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
		
	// Client-side routing to allow for deeplinking/bookmarks - use sammy library to handle routing results
	self.goToTab = function(tab) { location = '/manage#' + tab };

	Sammy(function() {
		// show individual ticket view
		this.get('/manage/:ticketId', function() {
			self.loadData(this.params.ticketId);
		});
		
	}).run();
};


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
	this.attachments = data.attachments;
	this.emails = data.emails;
	this.impact = ko.observable(data.impact || "normal");
	this.cc = data.cc;
	this.labels = data.labels;
}

function outgoingTicket(data) {
	this.subject = data.subject;
	this.from = data.from;
	this._id = data._id;
	this.status = data.status;
	this.description = data.description;
	this.notes = data.notes;
	this.attachments = data.attachments;
	this.emails = data.emails;
	this.impact = data.impact;
	this.cc = data.cc;
	this.labels = data.labels;
}


//get to work!
ko.applyBindings(new TicketViewModel());
