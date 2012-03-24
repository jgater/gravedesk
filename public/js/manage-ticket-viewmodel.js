//data model

function Ticket(data) {
	this.age = moment(data.date).fromNow();
	this.friendlydate = moment(data.date).format('ddd MMM Do YYYY, hh:mm');
	this.subject = data.subject;
	this.from = data.from;
	this._id = data._id;
	this.status = data.status;
	this.description = data.description;
	this.notes = data.notes;
	this.attachments = data.attachments;
	this.history = data.emails;
	this.impact = data.impact || "normal";
	this.cc = data.cc;
	this.labels = data.labels;
}

// view model
function TicketViewModel() {
	// associated Data
	var self = this; //using self avoids scope problems with methods
	self.tabs = ['Open', 'Pending', 'Longterm', 'Closed'];
	self.chosenTabId = ko.observable(); // remember, 'observables' are wrapper functions, not actual data structures per se.
	self.chosenTicketData = ko.observable();
	self.chosenTicketData.tickets = ko.observableArray();
	// Operations
	
	// Client-side routing to allow for deeplinking/bookmarks - use sammy library to handle routing results
	self.goToTab = function(tab) { location = '/manage#' + tab };
	self.goToTicket = function(ticket) {location = '/manage/' + ticket._id };

	Sammy(function() {
		// show individual ticket view
		this.get('/manage/:ticketId', function() {
			self.chosenTicketData(null); // clear the ticket data first, just in case 
			self.chosenTabId(null); //remove any active tab
			$.getJSON('/api/tickets/'+this.params.ticketId, function(allData){ //get ticket with _id of ticketId
				var mappedTicket = new Ticket(allData); //return a processed ticket
				self.chosenTicketData(mappedTicket); //put into chosenTicketData
			});
		});
		
	}).run();
};




//get to work!
ko.applyBindings(new TicketViewModel());
