$(document).ready(function() {
	
	/* Utilities */
	/*
	If a string matches a string in an array of 
	strings add that element of the string array to an 
	array of matching strings. Once all the strings have been
	compared, return the array of matching strings
	*/
	var searchStringInArray = function (string, stringArray) {
		console.log(stringArray);
    var matchingStringArrayElements = [];
    for (var j=0; j<stringArray.length; j++) {
        if (stringArray[j].match(string)) {
        	console.log('match')
        	matchingStringArrayElements.push(stringArray[j])
        	console.log(stringArray[j]);
        } else {
        	//do nothing
        }
    }
    return matchingStringArrayElements;
	}

	/* 
	Repopulate an area with a new array of data when
	given a new array
	*/
	var populateWithArray = function (area, array, classOfEachArrayElement) {
		console.log('populate with ' + array.join(' | '));
		$(area).html('');
		for (var j=0; j<array.length; j++) {
			console.log(array[j]);
			$(area).append('<span class="' + classOfEachArrayElement + '">' + array[j] + ' </span>')
    }
	}

	/*
	When the user is typing in the possible indicator input
	text element of the modal triage form compare what they
	are typing with the existing list of indicators. If what
	they are typing does not match an existing indicator, ask
	if this is a new indicator and provide a link
	to show the new indicator form. If it does match
	an existing indicator (lowercase and trimmed) show the upload data
	form and that indicator's metadata.
	*/
	$( "#possible-indicator" ).on( "keyup", function() {
	  var indicatorsMatchingPossibleIndicator = [];
	  var currentPossibleIndicator = $( this ).val();
	  
	  /*
	  While there is text in the possible indicator text box 
	  display the link to add a new indicator
		*/
		if (currentPossibleIndicator != "") {
			$('.btn-new-indicator-form').show();
			// console.log('show link to new form');

		  /*
		  For each of the indicators, if what the user is
		  typing matches some of the characters in an indicator, add
		  that indicator to an array of possible matching indicators to 
		  be displayed as suggestions to the user
		  */
		  indicatorsMatchingPossibleIndicator = searchStringInArray(currentPossibleIndicator, dummyDataIndicators.indicators);
		  populateWithArray('#indicator-suggestions', indicatorsMatchingPossibleIndicator, 'suggested-indicator');
		  $( ".suggested-indicator" ).on( "click", function() {
		  	console.log('clucked');
		  	$( '#possible-indicator' ).val($( this ).text());
		  })
		};





		/*
	  If what a user has typed matches an indicator exactly 
	  hide the link to add a new indicator
	  */



	  // if searchStringInArray(currentPossibleIndicator, dummyDataIndicators.indicators) {

	  // }  
	});	
});











