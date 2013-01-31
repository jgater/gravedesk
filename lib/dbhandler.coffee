# db setup requirements
mongoose = require("mongoose")

class DBHandler

	connectDB: (callback) ->
		console.log "Connecting to DB"
		mongoose.connect "mongodb://localhost:27017/gravedesk"
		db = mongoose.connection
		db.on "error", (err) ->
			console.log "DB connection failed; " + err
			callback err
		db.once "open", ->
			console.log "DB connection successful."
			callback null

	closeDB: ->
		mongoose.disconnect()

module.exports = DBHandler