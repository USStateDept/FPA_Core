
// Database config
var pg = require('pg');

// 
var bcrypt   = require('bcrypt-nodejs');

/**
 * User Model
 *
 * Find.state.gov user model
 *
 * @class Data
 * @author Michael Ramos 
 */
class UserModel {
    constructor(user) {
        this.user = user;
 }

 	// usage : var something = class.getProfileData
    get ProfileData(user = this.user) {
    	if ( isAuthenticated(this.user.email) ){
    		var profileData = {};
    		// TODO Grab profile data and send to client
    		// query using user param
    		return profileData;
    	}
    	else {
    		// User not logged in, return error message
    		return { error: "User not logged in - can't grab data"};
    	}
     }

     // usage : class.ProfileData = new object
     set ProfileData(user){
     	// in order to change data user must be logged in and as the same user trying to change
     	if ( isAuthenticated(this.user.email && user.username === this.user.username) ){
    		// TODO Update the user
    	}
    	else {
    		// User not logged in, return error message
    		return { error: "User not logged in - can't update user"};
    	}
     }

     createNewUser() {
     	// TODO insert a new user into DB
     	// hash password this.user.password
     }
}


