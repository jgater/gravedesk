//data model
function TicketSummary(data) {
	this.age = moment(data.date).fromNow(true);
	this.friendlydate = moment(data.date).format('ddd MMM Do YYYY, hh:mm');
	this.subject = data.subject;
	this.from = data.from;
	this._id = data._id;
}

// view model
function TicketViewModel() {
	// associated Data
	var self = this; //using self avoids scope problems with methods
	self.tabs = ['Open', 'Pending', 'Longterm', 'Closed'];
	self.chosenTabId = ko.observable(); // remember, 'observables' are wrapper functions, not actual data structures per se.
	self.chosenTabData = ko.observable();
	// Operations
	
	// Client-side routing to allow for deeplinking/bookmarks - use sammy library to handle routing results
	self.goToTab = function(tab) { location = '/manage#' + tab };
	self.goToTicket = function(ticket) {location = '/manage/' + ticket._id };

	Sammy(function() {
		// show tab view contents, i.e. table
		this.get('#:tab', function() {
			self.chosenTabData(null); // clear tab data first, just in case
			self.chosenTabId(this.params.tab); //make the selected tab match the request
			$.getJSON('/api/tickets/status/'+this.params.tab, function(allData){ //get all tickets with status of 'tab'
				var mappedTickets = $.map(allData, function(item) { return new TicketSummary(item) }); //return an array of processed(mapped) tickets
				self.chosenTabData({tickets: mappedTickets}); //put into chosenTabData.tickets (syntax like this because it's a function...)
			});
		});

		//default view
		this.get('/manage', function() { this.app.runRoute('get', '#'+self.tabs[0]) }); //if no specific page requested, open the first tab view
	}).run();
};




//get to work!
ko.applyBindings(new TicketViewModel());
