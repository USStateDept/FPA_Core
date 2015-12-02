/**
 * Setup API Endpoint
 *
 * Pull base data such as Categories and indicators
 * @author Michael Ramos 
 */
'use strict';

import CategoryModel from '../../models/category';
import IndicatorModel from '../../models/indicator';

module.exports = function (router) {

	/**
	 * @GET localhost/setup/category
	 */
    router.get('/category', function (req, res) {
    	var cm = new CategoryModel();
    	res.send(cm.getAllCategories());
	});      

	/**
	 * @GET localhost/setup/indicator
	 */
	router.get('/indicator', function (req, res) {
    	var cm = new CategoryModel();
    	res.send(cm.getAllCategories());
	});   

};