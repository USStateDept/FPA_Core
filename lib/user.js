/**
 * User Model
 *
 * Find.state.gov user model
 * @author Michael Ramos 
 */
 
'use strict';

// Database config
var pg = require('pg');

// creation dependensies
//var bcrypt   = require('bcrypt-nodejs');


/*
 * 
 * @class User
 */
export default class User {
    
    constructor(user) {
        this.user = user;
 	}

    getUserData() {
    	// if ( isAuthenticated(this.user.email) ){
    	// 	var profileData = {};
    	// 	// TODO Grab profile data and send to client
    	// 	// query using user param
    	// 	return profileData;
    	// }
    	//else {
    		// User not logged in, return error message
    		return { error: "User not logged in - can't grab data"};
    	//}
     }

     updateUserData(){
     	// in order to change data user must be logged in and as the same user trying to change
     	if ( isAuthenticated(this.user.email && user.username === this.user.username) ){
    		// TODO Update the user
    		// use this.user
    	}
    	else {
    		// User not logged in, return error message
    		return { error: "User not logged in - can't update user"};
    	}
     }

     deleteUser() {

     }

     createNewUser() {
     	// TODO insert a new user into DB
     	// hash password this.user.password
     	// use this.user
     	// make sure user doesn't already exist
     }

}


