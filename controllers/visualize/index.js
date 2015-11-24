'use strict';

var DataModel = require('../../models/data');

module.exports = function (router) {

    router.get('/', function (req, res) {

    	var ds = new DataModel(req, res, function(resdata){
			if (! ds){
				errorHandling.handle("There was an error", res);
			}
			else{
				res.send(resdata);
			}	
			ds.closeConnection();		
		});
	});
        

};
