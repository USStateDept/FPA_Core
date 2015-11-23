/**
 * Establishing the routes / API's for this server
 */
var App = require("../core");
var _ =  require("underscore");
var errorHandling = require("./errorHandling");
var tokens = require("../tokens");
var config = require("config").get("v1");
var DataSource = require("./model");

module.exports = function() {

	// Validate token in routine
	function validateToken(req, res, next) {
		// Handle secret admin access
		if(config.adminKeyEnabled && req.query.secret_admin === config.adminKey) {
			next();
		} else {
			try {
				if(!req.headers.api_token) {
					throw { code: "NO_TOKEN" };
				}

				if(!req.headers.api_secret) {
					throw { code: "NO_TOKEN" };
				}

				if(!tokens[req.headers.api_token]) {
					throw { code: "INVALID_TOKEN" };
				}

				if(!tokens[req.headers.api_token].secret !== req.headers.api_secret) {
					throw { code: "INVALID_TOKEN" };
				}

				next();
			} catch(e) {
				errorHandling.handle(e, res);
			}
		}
	}

	/**
	 * @api {get} "/api/5/slicer/aggregate" 
	 *
	 */
	App.Express.get("/api/5/slicer/aggregate", function (req, res) {
		res.header('Access-Control-Allow-Origin', '*');
		res.header('Access-Control-Allow-Methods', 'GET');
		res.header('Access-Control-Allow-Headers', 'Content-Type');

		var ds = new DataSource(req, res, function(resdata){
			if (! ds){
				errorHandling.handle("There was an error", res);
			}
			else{
				res.send(resdata);
			}	
			ds.tearDown();		
		});
	});


};