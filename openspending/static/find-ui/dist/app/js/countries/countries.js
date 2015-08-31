(function() {

    setTimeout(function() {
        window.visualization.createMap();
    }, 10);
	
	$("#filterCountries").keyup(function(e){
		if (e.keyCode==13){
			$("#countryList div div").first().click();
		}
		else{

			var filterValue = this.value;

			var countries = vizModel.countriesModelMaster();
			vizModel.countriesModel.removeAll();

			for (var x in countries) {
				if (countries[x].label.toLowerCase().indexOf(filterValue.toLowerCase()) >= 0) {
					vizModel.countriesModel.push(countries[x]);
				}
			}

			$("#countryList div").first().css("background-color","#FFFF00");

			return true;
		}
    });
}())