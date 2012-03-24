//data model

function TicketViewModel() {
	// Data
	var self = this;
	self.tabs = ['Open', 'Pending', 'Longterm', 'Closed'];
	self.chosenTabId = ko.observable();
	self.chosenTabData = ko.observable();
	self.chosenTicketData = ko.observable();
	self.chosenTicketData.tickets = ko.observableArray();
	// Operations
	self.goToTab = function(tab) { 
		self.chosenTicketData(null); //stop showing a ticket
		self.chosenTabId(tab);
		$.getJSON('api/tickets/status/'+tab, function(data){
			self.chosenTabData({tickets: data});
		});
	};
	self.goToTicket = function(ticket) { 
		self.chosenTabData(null); // Stop showing a folder
		$.getJSON('api/tickets/'+ticket._id, self.chosenTicketData);
	};
	// Start state
	self.goToTab('Open');
};




//get to work!
ko.applyBindings(new TicketViewModel());
