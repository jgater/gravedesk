
// view model
function TicketViewModel() {
	// associated Data
	var self = this; //using self avoids scope problems with methods
	self.tabs = ['Open', 'Pending', 'Longterm', 'Closed'];
	self.chosenTabId = ko.observable(); // remember, 'observables' are wrapper functions, not actual data structures per se.
	self.chosenTicketData = ko.observable();
	// Operations
	self.loadData = function(ticketId){
		$.getJSON('/api/tickets/'+ticketId, function(allData){ //get ticket with _id of ticketId
				self.chosenTicketData(new incomingTicket(allData)); //put into chosenTicketData
			});
	};
	self.closeTicket = function() {
		self.chosenTicketData().status("Closed");
		self.updateData(self.chosenTicketData()._id);
	};
	self.updateData = function(ticketId){
		var data = new outgoingTicket(ko.toJS(self.chosenTicketData));
		$.ajax('/api/tickets/'+ticketId, {
            data: ko.toJSON(data),
            type: "PUT", contentType: "application/json",
            success: function(result) { alert(result) }
        });
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
	this.impact = data.impact || "normal";
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
