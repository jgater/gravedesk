# db setup requirements
mongoose = require("mongoose")

class DBHandler

	connectDB: (callback) ->
		console.log "Connecting to DB"
		mongoose.connect "mongodb://localhost:27017/gravedesk", (err) ->
			if err
				console.err "DB connection failed; " + err
				callback err
			else
				console.log "DB connection successful."
				callback null

	closeDB: ->
		mongoose.disconnect()

module.exports = DBHandler