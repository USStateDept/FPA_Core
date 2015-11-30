/**
 * Ingest Endpoint
 *
 * Inserting Data into the DBs
 * @author Michael Ramos && Leroy Bryant && Terry Creamer
 */

'use strict';

import CategoryModel from '../../models/category';
import IndicatorModel from '../../models/indicator';

module.exports = function (router) {

	/**
	 * @GET localhost/ingest
	 */
    router.get('/', function (req, res) {
    		
    		// TODO Send html file to client
    		// res.send('PATH TO HTML FORM');
    		res.sendFile('/Users/bryantlc/FPA_Core/public/form.html');
    
	});

    /**
	 * @POST localhost/ingest
	 */
	router.post('/', function (req, res) {
    		
    		// TODO handle form data
    		// parse req, validate, connect to DB, run sql statements

            var thisPostsFormData = req.body; 
            res.send('<a href="/">back</a><p><pre>' + JSON.stringify(thisPostsFormData) + '</pre></p>');
            console.log(thisPostsFormData);
    
	});

    router.post('/existing-indicator-data', function (req, res) {
            
            // TODO handle form data
            // parse req, validate, connect to DB, run sql statements

            var thisPostsFormData = req.body; 
            res.send('<a href="/">back</a><p><pre>' + JSON.stringify(thisPostsFormData) + '</pre></p>');
            console.log(thisPostsFormData);
    
    });
        

};
