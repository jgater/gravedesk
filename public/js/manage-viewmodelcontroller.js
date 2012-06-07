//view model controller
function ManageViewModelController(ticketcount,statuslist,lang) {
	var self = this;
	//instruct ajax queries not to cache - fix for IE9 JSON caching
	jQuery.ajaxSetup({ cache: false });
	self.topbarView = new TopBarViewModel();
  self.tabsView = new tabsViewModel(ko.mapping.fromJS(ticketcount),statuslist);
	self.tableView = new tableViewModel();
	self.ticketView = new ticketViewModel(lang);
	// respond to server command to update ticket views
	now.ticketUpdate = function(ticketcount){
		ko.mapping.fromJS(ticketcount,self.tabsView.tabcount);
		if (self.tableView.showTable()) {self.tableView.getData( self.tabsView.chosenTabId() )}
		//probably not watching the same ticket that triggered the update, but update everyone's just in case
		if (self.ticketView.showTicket()) {
			self.ticketView.getData( self.ticketView.ticketData()._id );
			self.tabsView.chosenTabId(self.ticketView.ticketData().status());
		}
	};
	//respond to server advising new ticket added to db
	now.newTicket = function(ticketcount){
		ko.mapping.fromJS(ticketcount,self.tabsView.tabcount);
		if (self.tableView.showTable()) {self.tableView.getData( self.tabsView.chosenTabId() )}
	};

	Sammy(function() {
		this.get('/manage#/:ticketid', function (){
			self.ticketView.getData(this.params.ticketid);
			self.tableView.showTable(false);
			self.ticketView.showMailForm(false);
			self.ticketView.showTicket(true);
			
		});
		this.get('/manage#:tab', function() {
			self.tableView.getData(this.params.tab);
			self.ticketView.showTicket(false);
			self.ticketView.showMailForm(false);
			self.tableView.showTable(true);
			self.tabsView.chosenTabId(this.params.tab); //make the selected tab match the request
		});
		this.get('/manage', function() { this.app.runRoute('get', '/manage#'+self.tabsView.tabs[0]) }); //if no specific page requested, open the first tab view		
	}).run();

}

//-------------------------------

// view model
function tabsViewModel(tabcount,tabs) {
	// associated Data
	var self = this; //using self avoids scope problems with methods
	self.tabs = tabs;
	self.tabcount = tabcount;
	self.chosenTabId = ko.observable(); // remember, 'observables' are wrapper functions, not actual data structures per se.	
	// Operations
	// Client-side routing to allow for deeplinking/bookmarks - use sammy library to handle routing results
	self.goToTab = function(tab) { location.hash = tab };
};

//-------------------------------

// view model
function tableViewModel() {
	// associated Data
	var self = this; //using self avoids scope problems with methods
	self.tickets = ko.observableArray();
	self.showTable = ko.observable(false);
	// Operations
	self.sortByDate = function () {
		self.tickets.sort( function(left,right) { // sorts by date, newest first
					return (left.date === right.date) ? 0 : (left.date < right.date) ? 1 : -1;
		});
	};
	self.getData = function (status) {
			$.getJSON('/api/tickets/status/'+status, function(allData){ //get all tickets by status
				var mappedTickets = $.map(allData, function(item) { return new TicketSummary(item) } ); //return an array of processed(mapped) tickets
				self.tickets(mappedTickets); 
				self.sortByDate();
			});
	};
}

//data model
function TicketSummary(rawticket) {
	this.id = rawticket._id;
	this.age = moment(rawticket.date).fromNow(true);
	this.created = moment(rawticket.date).format('ddd MMM Do YYYY, HH:mm');
	if (rawticket.lastmodified) {
		this.lastmodified = moment(rawticket.lastmodified).fromNow();	
	} else {
		this.lastmodified = "Unknown"
	}
	
	this.subject = rawticket.subject;
	this.from = rawticket.from;
	this.date = rawticket.date;
	this.impact = rawticket.impact || "Normal";
}

//-------------------------------

//individual ticket view model
function ticketViewModel(lang) {
	// associated Data
	var self = this; //using self avoids scope problems with methods
	self.impacts = ko.observableArray(['High', 'Normal', 'Low']);
	self.ticketData = ko.observable();
	self.showTicket = ko.observable(false);
	self.showMailForm = ko.observable(false);
	self.editMode = ko.observable(false);
	self.allowMailCancel = ko.observable(true);
	self.closeWhenDone = false;
	self.mailForm = {
		to: ko.observable(),
		subject: ko.observable(),
		html: ko.observable()
	};
	self.hasAttachments = ko.computed(function(){
		if ( self.ticketData() ) {
			return (self.ticketData().attachments().length > 0);
		} else {
			return false;
		}
	});
	self.isClosed = ko.computed( function() {
		if (!self.ticketData()) { return false; } 
		else if (self.ticketData().status() == "Closed") {return true;}
		else {return false;}	
	});
	self.alertBox = {};
	self.alertBox.show = ko.observable(false);
	self.alertBox.text = ko.observable('');
	self.alertBox.success = ko.observable(false);
	self.alertBox.error = ko.observable(false);
	self.alertBox.info = ko.observable(false);

	// Operations

	self.setAlertBox = function(text,type,timeout) {
		self.alertBox.text(text);
		self.alertBox.success(false);
		self.alertBox.error(false);
		self.alertBox.info(false);
		if (type) {
			self.alertBox[type](true);
		}
		self.alertBox.show(true);
		window.scrollTo(0,0);
		if (timeout) {
			setTimeout(function(){
					self.clearAlertBox();
				}, (timeout*1000) );	
		}
	};

	self.clearAlertBox = function() {
		self.alertBox.text(null);
		self.alertBox.show(false);
		self.alertBox.success = ko.observable(false);
		self.alertBox.error = ko.observable(false);
		self.alertBox.info = ko.observable(false);
	};

	self.writeMail = function() {
		self.prepareMailForm("reply",function(err){
			if (err) {
				alert(err);
			} else {
				self.closeWhenDone = false;
				// reveal the form
				self.showMailForm(true);
				// give focus to textarea editor
				$("#formtextarea-wysiwyg-iframe").focus();	
				//scroll to mailform
				var myoffset = $("#sendmailform").offset().top - 50;
				window.scrollTo(0,myoffset);
					
			}
		});
	};

	self.sendMailForm = function() {
		var newvalue = $("#formtextarea").wysiwyg("getContent");
    self.mailForm.html(newvalue);
    self.sendToSMTP();
	};

	self.cancelMailForm = function() {
		//hide form
		self.showMailForm(false);	
		//scroll to top
		window.scrollTo(0,0);
	};

	self.closeTicket = function() {
		self.prepareMailForm("close", function(err){
			if (err) {
				alert(err);
			} else {
				self.closeWhenDone = true;
				self.sendToSMTP();
			}
		});
	};

	self.customCloseTicket = function() {
		self.prepareMailForm("close", function(err){
			if (err) {
				alert(err);
			} else {
				self.closeWhenDone = true;
				self.showMailForm(true);
				// give focus to textarea editor
				$("#formtextarea-wysiwyg-iframe").focus();
				//scroll to mailform
				var myoffset = $("#sendmailform").offset().top - 50;
				window.scrollTo(0,myoffset);				
			}
		});
	};

	self.prepareMailForm = function(action, callback) {
		self.showMailForm(false);
		$("#sendMailFormButton").button('reset');
		self.allowMailCancel(true);
		//pull init data from ticketData
		var id = self.ticketData()._id;
		var from = self.ticketData().from();
		var sub = self.ticketData().subject();
		var description = self.ticketData().description();
		// pre-populate the form text fields
		self.mailForm.to(from);
		if (action=="reply") {
			self.mailForm.subject("RE: " + sub + " - " + lang.reply.subject + " - ID: <" + id + ">");
			self.mailForm.html(lang.reply.body + description);
			callback(null);
		} else if (action=="close") {
			self.mailForm.subject("RE: " + sub + " - " + lang.closeReply.subject + " - ID: <" + id + ">");
			self.mailForm.html(lang.closeReply.body + description);
			callback(null);
		}
		else callback("Unexpected type of mail form action!");
	};

	self.sendToSMTP = function() {
		// do sending status on button
		$("#sendMailFormButton").button('loading');
		self.allowMailCancel(false);

		now.sendMail(ko.toJS(self.mailForm),self.ticketData()._id,function(err){
			if (err) {
					self.setAlertBox("Error encountered sending email: " + JSON.stringify(err) , "error", 20 );
			} else {
				//hide mail form
				self.showMailForm(false);
				// do alert
				self.setAlertBox("Email sent successfully to " + self.mailForm.to(), "success", 10 );	
				if (self.closeWhenDone) {
					self.changeStatus("Closed");
				}
			}
		});
	};

	self.getData = function(ticketId){
		$.getJSON('/api/tickets/'+ticketId, function(data){ //get ticket with _id of ticketId
				var koTicket = new incomingTicket(data);			 
				self.ticketData(koTicket);
		});
	};
	self.updateData = function(ticketId){
		var data = new outgoingTicket(ko.toJS(self.ticketData));
			$.ajax('/api/tickets/'+ticketId, {
        data: ko.toJSON(data),
        type: "PUT", contentType: "application/json",
        success: function(result) { 
        	self.setAlertBox("Changes saved.", "success", 5 );
        }
    	});

	};
	self.deleteData = function(ticketId){
		$.ajax('/api/tickets/'+ticketId, {
            type: "DELETE", contentType: "application/json",
            success: function(result) {window.history.back(); }
        });
	};
	self.changeStatus = function(data) {
			self.ticketData().status(data);
			self.updateData(self.ticketData()._id);
	};

	self.deleteTicket = function() {
		self.deleteData(self.ticketData()._id);
	};
	self.changeImpact = function(data) {
		self.ticketData().impact(data);
		self.updateData(self.ticketData()._id);
	};
	self.enableEditTicket = function() {
		self.editMode(true);
	};
	self.disableEditTicket = function() {
		self.editMode(false);
		self.getData(self.ticketData()._id);
	};
	self.saveEditChanges = function() {
		var newvalue = $("#descriptiontextarea").wysiwyg("getContent");
    self.ticketData().description(newvalue);
    self.editMode(false);
		self.updateData(self.ticketData()._id);
	};
}

//data models

function incomingTicket(data) {
	this.age = moment(data.date).fromNow();
	this.created = moment(data.date).format('ddd MMM Do YYYY, HH:mm');
	this.lastmodified = moment(data.lastmodified).fromNow();
	this.friendlylastmodified = moment(data.lastmodified).format('ddd MMM Do YYYY, HH:mm');
	this.subject = ko.observable(data.subject);
	this.from = ko.observable(data.from);
	this._id = data._id;
	this.status = ko.observable(data.status);
	this.description = ko.observable(data.description);
	this.notes = data.notes;
	this.emails = ko.observableArray( $.map(data.emails, function(item) { return new incomingEmail(item) } ) );
	this.impact = ko.observable(data.impact || "normal");
	this.cc = data.cc;
	this.labels = data.labels;
	this.attachments = ko.computed(function(){
		var mergedArray = [];
		for (var i in this.emails() ) {
			for (var j in this.emails()[i].attachments) {
				var tempdate = this.emails()[i].attachments[j].date;
				this.emails()[i].attachments[j].date = moment(tempdate).format('ddd MMM Do YYYY, HH:mm');			
			}
			mergedArray = mergedArray.concat(this.emails()[i].attachments);
		}

		return mergedArray;
	}, this);
}

function outgoingTicket(data) {
	this.lastmodified = new Date();
	this._id = data._id;
	this.status = data.status;
	this.impact = data.impact;
	this.from = data.from;
	this.subject = data.subject;
	this.description = data.description;
}

function incomingEmail(data) {
	this.from = data.from;
	this.to = data.to;
	this.subject = data.subject;
	this.cc = data.cc;
	if (data.date) {
		this.friendlydate = moment(data.date).format('ddd MMM Do YYYY, HH:mm');	
		this.date = data.date;
	} else {
		this.friendlydate = "no date set";
	}	
	this.body = data.html || data.plaintext;
	this.plaintext = data.plaintext;
	this.html = data.html;
	this.attachments = data.attachments;
	this.show = ko.observable(false);
	this.reverseShow = function(){this.show( !this.show() )};
}



