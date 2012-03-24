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
	
	// Client-side routing to allow for deeplinking/bookmarks - use sammy library to handle routing results
	self.goToTab = function(tab) { location.hash = tab };
	self.goToTicket = function(ticket) {location.hash = self.chosenTabId() + '/' + ticket._id };

	Sammy(function() {
				this.get('#:tab', function() {
						self.chosenTicketData(null); //don't show ticket data framework
						self.chosenTabData(null); // clear tab data first, just in case
						self.chosenTabId(this.params.tab); //make the selected tab match the request
						$.getJSON('/api/tickets/status/'+this.params.tab, function(data){
							self.chosenTabData({tickets: data}); //get all tickets matching status of 'tab', put into chosenTabData.tickets
						});
				});
				this.get('#:tab/:ticketId', function() {
					self.chosenTabData(null); // Stop showing tab datatable
					self.chosenTicketData(null); // clear the ticket data first, just in case 
					self.chosenTabId(this.params.tab); //make the selected tab match the request
					$.getJSON('/api/tickets/'+this.params.ticketId, self.chosenTicketData); //get ticket details matching requested ticketId, put into chosenTicketData
				});
				this.get('', function() { this.app.runRoute('get', '#'+self.tabs[0]) }); //if no specific page requested, open the first tab view
	}).run();
};




//get to work!
ko.applyBindings(new TicketViewModel());
