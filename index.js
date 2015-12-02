'use strict';

var express = require('express');
var kraken = require('kraken-js');
var options, app;
// var ModelSet = require("./models");
import ModelSet from './models';

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
       
        // setup the model
        var ms = new ModelSet(config.get('database'));

        ms.init().then(function () {
            console.log('===> 💾  Database Synced -- Success');
            next(null, config);
        }).catch(function (err) {
            console.log('===> 🆘 💾  Database Setup Error: ' + err.message);
        }); 
    }
};

app = module.exports = express();
app.use(kraken(options));
app.use(express.static(__dirname));
app.on('start', function () {
    
    if ( app.kraken.get('env:env') === "development" ) {
    	console.log('===> 🚧  Using Development Enviornment');
    } else if ( app.kraken.get('env:env') === "production" ) {
    	console.log('===> 🔆  Using Production Enviornment');
    } else {
    	console.log('===> ⁉  Using Unknown Enviornment');
    }
    console.log('===> ✅  API Server is ready to serve requests.');
    
});
