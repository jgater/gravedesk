#
# Module dependencies.
#
express = require "express"
fs = require "fs"
nowjs = require "now"
async = require "async"
util = require "util"
passport = require "passport"
events = require "events"
imap = require "imap" 

# gravedesk internal library modules

EmailHandler = require "./lib/emailhandler"
{db} = require "./lib/" 
{tickethandler} = require "./lib"
userdb = require "./lib/userprovider"

# settings files
settings = require("./settings")
lang = require("./lang/english")

# Configuration

imapServer = new imap.ImapConnection(
	username: settings.imap.username
	password: settings.imap.password
	host: settings.imap.host
	port: settings.imap.port
	secure: settings.imap.secure
)

emailhandler = new EmailHandler imapServer 

if settings.https.enable
	app = module.exports = express.createServer(
		key: fs.readFileSync(settings.https.key)
		cert: fs.readFileSync(settings.https.cert)
	)
else
	app = module.exports = express.createServer()

app.configure ->
	app.set "views", __dirname + "/views"
	app.set "view engine", "jade"
	app.use express.cookieParser()
	app.use express.bodyParser()
	app.use express.session(secret: "tom thumb")
	app.use passport.initialize()
	app.use passport.session()
	app.use app.router
	app.use express.static(__dirname + "/public")
	app.set "view options",
		pretty: true


app.configure "development", ->
	app.use express.errorHandler(
		dumpExceptions: true
		showStack: true
	)

app.configure "production", ->
	app.use express.errorHandler()


# Routes
require("./routes") app


# logging

tickethandler.on "addTicketError", (err) -> console.error "Error adding ticket: " + err


emailhandler.on "imapConnectionSuccess", -> console.log "Connected to IMAP."
emailhandler.on "fetchSuccess", -> console.log "All emails retrieved from server."
emailhandler.on "fetchMessagesAmount", (quantity) -> console.log "There are " + quantity + " emails to be fetched."
emailhandler.on "imapFlagSuccess", (id, isNew, uid) -> console.log "Email " + uid + " successfully processed and marked as read."
emailhandler.on "imapConnectionClose", -> console.log "Closing IMAP connection."
emailhandler.on "smtpSendSuccess", (to) -> console.log "Mail sent to " + to

emailhandler.on "imapConnectionFailure", (err) -> console.error "Error connecting to IMAP server: " + err
emailhandler.on "fetchMessagesFailure", (err) -> console.error "Error fetching emails: " + err
emailhandler.on "imapFlagFailure", (err, uid) -> console.err "Error marking mail " + uid + " as read: " + err 
emailhandler.on "smtpSendError", (err, to) -> console.err "Error sending mail to " + to + " : " + err

# start services

# connect to db
async.series [db.connectDB, (callback) ->
	
	# add default website admin user to db 
	userdb.saveOrReplaceUser settings.defaultAdmin, callback

# fire up web server
, (callback) ->
	if settings.https.enable
		app.listen settings.https.port, callback
	else
		app.listen settings.defaultPort, callback
	console.log "Express server listening on port %d in %s mode", app.address().port, app.settings.env
], (err) ->
# callback error handler
	if err
		console.error "Problem with starting background services; " + err
		process.exit err

# start imap
emailhandler.connectImap()


# initialize now.js
if settings.proxy.enable
	everyone = nowjs.initialize(app,
		port: settings.proxy.proxyPort
		socketio:
			transports: ["xhr-polling", "jsonp-polling"]
	)
else if settings.https.enable
	everyone = nowjs.initialize(app,
		port: settings.https.port
		socketio:
			transports: ["websocket", "xhr-polling", "jsonp-polling"]
	)
else
	everyone = nowjs.initialize(app,
		port: settings.defaultPort
		socketio:
			transports: ["websocket", "xhr-polling", "jsonp-polling"]
	)
console.log "now.js added to server app."

# now functions    
everyone.now.getManageStartupData = (callback) ->
	tickethandler.countAllByStatus settings.statusList, (err, ticketcount) ->
		if err
			console.error "Could not get ticket counts; "
		else
			callback ticketcount, settings.statusList, lang


everyone.now.postNewAdminAccount = (newAdminAccount, callback) ->
	userdb.saveUser newAdminAccount, callback

everyone.now.getAdminStartupData = (callback) ->
	callback settings

everyone.now.getAdminUsers = (callback) ->
	userdb.findAllUsers (err, allusers) ->
		if err
			console.error "Could not get all user accounts; "
		else
			callback allusers

everyone.now.deleteAdminUser = (user, callback) ->
	userdb.deleteUser user, callback

everyone.now.sendMail = (mail, id, callback) ->
	emailhandler.sendMail mail, id
	callback null

# when db updates a ticket, trigger this event and tell the client to update tab ticket counts
tickethandler.on "ticketUpdated", ->
	tickethandler.countAllByStatus settings.statusList, (err, ticketcount) ->
		if err
			console.error "Could not get ticket counts; "
		else
			everyone.now.ticketUpdate ticketcount  if everyone.now.ticketUpdate

# when db adds a new ticket from email, trigger this event and tell the client to update their table view 
tickethandler.on "ticketListUpdated", ->
	tickethandler.countAllByStatus settings.statusList, (err, ticketcount) ->
		if err
			console.error "Could not get ticket counts; "
		else
			everyone.now.newTicket ticketcount  if everyone.now.newTicket




