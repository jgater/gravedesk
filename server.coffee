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

# gravedesk internal library modules

{ImapHandler} = require "./lib/emailhandler" 
{sendMail} = require "./lib/emailhandler"
db = require "./lib/dbhandler" 
ticketdb = require "./lib/ticketprovider"
userdb = require "./lib/userprovider"
{tickethandler} = require "./lib"

# settings files
settings = require("./settings")
lang = require("./lang/english")
imap = new ImapHandler()

# Configuration
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

# start imap
, imap.startMonitoring], (err) ->

# callback error handler
  if err
    console.error "Problem with starting background services; " + err
    process.exit err


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
  sendMail mail, id, callback


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


