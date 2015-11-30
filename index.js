'use strict';

var express = require('express');
var kraken = require('kraken-js');
var options, app;

/*
 * Create and configure application. Also exports application instance for use by tests.
 * See https://github.com/krakenjs/kraken-js#options for additional configuration options.
 */
options = {
    onconfig: function (config, next) {
        /*
         * Add any additional config setup or overrides here. `config` is an initialized
         * `confit` (https://github.com/krakenjs/confit/) configuration object.
         */
        next(null, config);
    }
};

app = module.exports = express();
app.use(kraken(options));
app.use(express.static(__dirname));
app.on('start', function () {
    console.log('✅  API is ready to serve requests.');
    if ( app.kraken.get('env:env') === "development" ) {
    	console.log('🚧  Using Development Enviornment');
    } else if ( app.kraken.get('env:env') === "production" ) {
    	console.log('🔆  Using Production Enviornment');
    } else {
    	console.log('⁉  Using Unknown Enviornment');
    }
    
});
