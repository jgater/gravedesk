//data model
function TicketViewModel() {
    // Data
    var self = this;
    self.folders = ['open', 'pending', 'longterm', 'closed'];
    self.chosenFolderId = ko.observable();
    self.chosenFolderData = ko.observableArray();
    // Behaviours
    self.goToFolder = function(folder) { 
    	self.chosenFolderId(folder); 
    	$.get('/api/tickets/status/'+folder, function(data) {
    	});
    			
    };
    // Start state
    self.goToFolder('open');
};

//get to work!
ko.applyBindings(new TicketViewModel());
