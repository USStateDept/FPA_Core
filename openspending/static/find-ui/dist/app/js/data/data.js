(function() {
	console.log('data.js has been hit');
	$("#tab-category").clickoutside(function(){
		if ($(".back").is(":visible")){
			$("#well-wrapper").hide();
			$(".list-group").hide();
			// window.utils.flipCardEvent();
		}
	});
}())