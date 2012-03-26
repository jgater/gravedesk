
// view model
function TabViewModel() {
	// associated Data
	var self = this; //using self avoids scope problems with methods
	self.tabs = ['Open', 'Pending', 'Longterm', 'Closed'];
	self.chosenTabId = ko.observable(); // remember, 'observables' are wrapper functions, not actual data structures per se.
	self.tickets = ko.observableArray();
	// Operations
	self.sortByDate = function () {
		self.tickets.sort( function(left,right) { // sorts by date, newest first
					return (left.date === right.date) ? 0 : (left.date < right.date) ? 1 : -1;
		});
	};

	self.getData = function (status) {
					$.getJSON('/api/tickets/status/'+status, function(allData){ //get all tickets by status
				var mappedTickets = $.map(allData, function(item) { return new TicketSummary(item) } ); //return an array of processed(mapped) tickets
				self.tickets(mappedTickets); //put into tickets array (syntax like this because it's a function...)
				self.sortByDate();
			});
				};

	// Client-side routing to allow for deeplinking/bookmarks - use sammy library to handle routing results
	self.goToTab = function(tab) { location.hash = tab };

	Sammy(function() {
		// show tab view contents, i.e. table
		this.get('#:tab', function() {
			self.chosenTabId(this.params.tab); //make the selected tab match the request
			self.getData(this.params.tab);
		});

		//default view
		this.get('/manage', function() { this.app.runRoute('get', '#'+self.tabs[0]) }); //if no specific page requested, open the first tab view
	}).run();
};

//data model
function TicketSummary(rawticket) {
	this.id = rawticket._id;
	this.age = ko.observable( moment(rawticket.date).fromNow(true) );
	this.friendlydate = ko.observable( moment(rawticket.date).format('ddd MMM Do YYYY, HH:mm') );
	this.subject = rawticket.subject;
	this.from = rawticket.from;
	this.date = rawticket.date;
}

//get to work!
ko.applyBindings(new TabViewModel());
