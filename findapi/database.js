var pg = require('pg');
var config = require("config");

module.exports = {
	connectionString: config.get("databaseURI") || 'postgres://localhost:5432/openspending'
};