(function() {

    setTimeout(function() {
        window.visualization.createMap();
    }, 10);
	
	$("#filterCountries").keyup(function(){
		
		var filterValue = this.value;

		var countries = vizModel.countriesModelMaster();
		vizModel.countriesModel.removeAll();

		for (var x in countries) {
			if (countries[x].label.toLowerCase().indexOf(filterValue.toLowerCase()) >= 0) {
				vizModel.countriesModel.push(countries[x]);
			}
		}

		return true;
    });
}())