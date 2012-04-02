GraveDesk
---------

Helpdesk issue tracker focused on receiving emails as the primary source of new tickets.

written in Javascript; using node.js, express/jade, mongoose/mongodb and node-imap.
Client-side rendering done with twitter-bootstrap, knockout.js and socketio (now.js)




Todo:

* ~~imap handler for importing tickets to db~~
* ~~DB handler framework~~
* ~~front-end framework using knockout~~
* ~~ticket list view & individual view~~
* ~~ticket status changes written to db~~
* ~~delete and close tickets~~
* ~~update ticketview when db changes~~
* ~~show ticket counts on tabs in ticket list view~~
* ~~add admin user account framework~~
* ~~show login status on topbar~~
* write installation instructions
* change look from bootstrap basic view
* better alert messages for administration registration and ticket views
* better visual indicator for high status tickets, both in list and individual views
* add ability to send reply and automatic emails via smtp
* allow disabling of auto-replies for status changes
* show attachments, notes and email history on individual ticket view
* allow private internal notes to be added to individual tickets
* allow non-admins to view their own tickets and status (Active Directory integration)
* web-form for submission of tickets outside of email
* markdown formatted FAQs on site
* switch to now.js for ticket view/save instead of RESTful API