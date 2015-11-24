'use strict';

// put any requiers up here 


module.exports = function (router) {

	/**
	 * @GET localhost/ingest
	 */
    router.get('/', function (req, res) {
    		
    		// TODO Send html file to client
    		// res.send('PATH TO HTML FORM');
    
	});

    /**
	 * @POST localhost/ingest
	 */
	router.post('/', function (req, res) {
    		
    		// TODO handle form data
    		// parse req, validate, connect to DB, run sql statements
    
	});
        

};
