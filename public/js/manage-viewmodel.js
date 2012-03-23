//data model

function TicketViewModel() {
    // Data
    var self = this;
    self.tabs = ['Open', 'Pending', 'Longterm', 'Closed'];
    self.chosenTabId = ko.observable();
    self.chosenTabData = ko.observableArray();
    self.chosenTicketData = ko.observable();

    // Operations
    self.goToTab = function(tab) { 
    	self.chosenTabId(tab);
    	self.chosenTicketData(null); //stop showing a ticket
    	$.getJSON('api/tickets/status/'+tab, self.chosenTabData);
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
