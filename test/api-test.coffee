chai = require 'chai'  
chai.should()  

api = require "../routes/api"
mongoose = require "mongoose"
ticket = require "../lib/models/ticket"

describe "routes api", ->
  describe "index", ->
    it "should display API available", ->
      req = null
      res = 
        send: (view, vars) ->
          view.should.equal "API is available."
      api.index(req, res)
