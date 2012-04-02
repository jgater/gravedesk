GraveDesk
=========

Helpdesk issue tracker focused on receiving emails via IMAP as the primary source of new tickets.

written in Javascript; using node.js, express/jade, mongoose/mongodb and node-imap.
Client-side rendering done with twitter-bootstrap, knockout.js and socketio (now.js)

Installation
============

* You'll need to download and install Node.js, obviously. Tested on 0.6.14 from nodejs.org
* A copy of mongodb from mongodb.org running on localhost, default port (27017)
* git clone this repository to a suitable folder
	`git clone git@bitbucket.org:jgater/gravedesk.git`
* install the necessary node.js modules via npm in the root of that folder (the one with app.js in)
	`npm install -d`
* copy settings.md to settings.js for default settings; edit settings.js as appropriate. You'll need to change the email server and IMAP login at the very least
* Note, it will read 'unread' emails in the mailbox folder specified, and mark them as read. Don't point at a folder you use for other purposes! Best to point at a dedicated IMAP account, of course.
* run from the root folder with node:
	`node app.js`
* server should now be available on http://localhost:3000 - you can login with the default admin account details in your settings.js

For 'production use', you'll need to set express into production mode. I also advise running on a proper node.js host or dedicated server (ubuntu, for example), likely with nodemon
or forever to keep the server running!
I also heavily recommend using a proxy front server, such as nginx with https support, though express can be configured to do https directly if you wish.
Given this is still under heavy development, you probably don't want to rely on it just yet!


Author's note
-------------

This is a project to scratch my own itch - building a helpdesk ticket system for my small support team, that uses email for communication with users, and a fast web-interface for management that doesn't suck. It's very much a work in progress. I owe a great deal to all the open-source projects that made it possible to write this; not just all the great projects that do all the heavy lifting, but the other open projects which I've been able to read through for example code to understand how to use a library effectively. I'm sharing my work back, as it's the least I can do in return.


Changelog
=========

Version 1.1.0
-------------

* First public release.
* Basic admin user framework complete; default admin account created at runtime, can register, list and delete other admin accounts.
* admin account required for access to manage tickets and create other admin accounts.
* Interim ticket management frontend built using knockout.js, a RESTful API and now.js for live updating.
* Tickets are listed by date; individual tickets can be deleted, changed to arbitrary status and closed.
* imap emails -> ticket library complete; 'processed' emails marked as read.
* functional - if basic - helpdesk complete.

Next version - Adding SMTP library for sending email replies, and the ability to see and edit more detail of individual tickets.

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
* write better installation instructions
* allow use of mongodb on alternative ports/server via settings.js
* change look from bootstrap basic view
* better alert messages for administration registration & deletion and ticket views
* better visual indicator for high status tickets, both in list and individual views
* add ability to send reply and automatic emails via smtp
* allow disabling of auto-replies for status changes
* show attachments, notes and email history on individual ticket view
* allow private internal notes to be added to individual tickets
* allow non-admins to view their own tickets and status (Active Directory integration)
* web-form for submission of tickets outside of email
* markdown formatted FAQs on site
* switch to now.js for ticket view/save instead of RESTful API

Licence
=======

Copyright (C) <2012> <James Gater>

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
