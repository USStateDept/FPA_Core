/**
 * The core app singleton
 * @class App
 */

var express = require("express");
var bodyParser = require("body-parser");
var config = require("./config");

var App = {
	Express: {},
	Server: {},
	init: function() {
		App.Express = express();

		App.Express.use(bodyParser());

		require("./routes")();

		App.Server = App.Express.listen(config.port, config.address, function() {
		    console.log("Listening on port %d", App.Server.address().port);

		});
	}
};

module.exports = App;