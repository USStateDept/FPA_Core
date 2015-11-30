// 

// Database config
var pg = require('pg');

// creation dependensies
var bcrypt   = require('bcrypt-nodejs');

/**
 * User Model
 *
 * Find.state.gov user model
 *
 * @class Indicators
 * @author Michael Ramos 
 */
class UserModel {
    constructor(user) {
        this.user = user;
 	}

    getUserData() {
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

     updateUserData(user){
     	// in order to change data user must be logged in and as the same user trying to change
     	if ( isAuthenticated(this.user.email && user.username === this.user.username) ){
    		// TODO Update the user
    	}
    	else {
    		// User not logged in, return error message
    		return { error: "User not logged in - can't update user"};
    	}
     }

     createNewUser(user) {
     	// TODO insert a new user into DB
     	// hash password this.user.password
     	// make sure user doesn't already exist
     }
     
}


