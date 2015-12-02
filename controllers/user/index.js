/**
 * User API Endpoint
 *
 * Pull base data such as Categories and indicators
 * @author Michael Ramos 
 */

'use strict';

import UserModel from '../../lib/user';


module.exports = function (router) {

	/**
	 * @GET localhost/setup/category
	 */
    router.get('/', function (req, res) {
    	var um = new UserModel();
    	res.send(um.getUserData());
	});        

};