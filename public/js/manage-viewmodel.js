//data model

function TicketViewModel() {
    // Data
    var self = this;
    self.tabs = ['Open', 'Pending', 'Longterm', 'Closed'];
    self.chosenTabId = ko.observable();
    self.chosenTabData = ko.observableArray();

    // Operations
    self.goToTab = function(tab) { 
    	self.chosenTabId(tab); 
    	$.getJSON('api/tickets/status/'+tab, function(allData) {
        self.chosenTabData(allData);
    	});
    };
    // Start state
    self.goToTab('Open');
};




//get to work!
ko.applyBindings(new TicketViewModel());
