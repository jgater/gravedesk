//
// Script to convert attachments from version 1.4 to 1.5 database format in gravedesk
//


//setup requirements
var async = require('async');
var dbhandler = require('./lib/dbhandler');
var db = new dbhandler.DB();
var ticketdb = dbhandler.TicketProvider;

// setup connection to database
db.connectDB(function(err){
	if (err) {
		console.log("connection to db failure; "+ err);
	}

	// find all ticket ids
	ticketdb.findAllIds(function(err,ids){
		if (err) {console.log(err);}
		else {
			var idIterator = function(id,callback){
				ticketdb.findById(id._id,function(err,ticket){
					if (!err) {
						for (var j in ticket.emails) {
							var attachments = ticket.emails[j].attachments;
							if (attachments && attachments.length != 0) {
								// save attachments to attachment directory
								
								ticketdb.saveAttachments(attachments, j, ticket._id);	
								// replace attachments with stub records
								var stubs = [];
								for (var k in attachments) {
									if (attachments[k].transferEncoding == 'base64') {
											var stub = {};
											stub.date = new Date();
											stub.fileName = encodeURIComponent(j+"_"+attachments[k].fileName);
											stub.contentType = attachments[k].contentType;
											stubs.push(stub);		
									}
								}
								if (stubs.length > 0 ) { console.log("Created stub links for ticket "+ticket._id ); console.log(stubs);}
								ticket.emails[j].attachments = stubs;	
							}				
						}
						ticketdb.updateTicketEmailsById(ticket._id,ticket,callback); 			
					} else {
							callback(err);
					}					
				});
			};
				
			async.forEachSeries(ids, idIterator, function(err){
				if(err){console.error(err);}
				else {console.log("Completed - ctrl-C to end.");}
			});
		}
	});
});
