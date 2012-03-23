//data model

function TicketViewModel() {
    // Data
    var self = this;
    self.folders = ['Open', 'Pending', 'Longterm', 'Closed'];
    self.chosenFolderId = ko.observable();
    self.chosenFolderData = ko.observableArray();

    // Operations
    self.goToFolder = function(folder) { 
    	self.chosenFolderId(folder); 
    	$.getJSON('api/tickets/status/'+folder, function(allData) {
        self.chosenFolderData(allData);
    	});
    };
    // Start state
    self.goToFolder('Open');
};




//get to work!
ko.applyBindings(new TicketViewModel());
