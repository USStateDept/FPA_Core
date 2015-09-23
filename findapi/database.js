var pg = require('pg');
var config = require("./config");

module.exports = {
	connectionString: config.databaseURI || 'postgres://localhost:5432/openspending'
};