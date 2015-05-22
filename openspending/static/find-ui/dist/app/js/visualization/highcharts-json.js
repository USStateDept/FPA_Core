(function() {

    window.prepareHighchartsJson = function(data, title, type, indicatorId) {

        var defaultCountries = ["australia", "new zealand", "sweden", "germany", "france", "ghana", "kenya", "south africa", "bangladesh", "pakistan", "cambodia"];
        var defaultVisibleCountries = ["australia", "germany", "kenya", "cambodia"];

        var cells = data.cells;
        var fromYear = data.cell[0].from[0];
        var toYear = data.cell[0].to[0];
        var categories = [];

        for (var i = fromYear; i <= toYear; i++) {
            categories.push(parseInt(i));
        }

        var series = {};
        var seriesArray = [];

        //TODO : do this in one loop
        _.forEach(cells, function(c) {
            series[c["geometry__country_level0.name"]] = []
        });
        //indicatorId = "gdp_per_capita";
        _.forEach(cells, function(c) {
            series[c["geometry__country_level0.name"]].push(c[indicatorId + "__amount_sum"]);
        });

        // var series = [{
        //     name: 'Angola',
        //     data: [7.0, 6.9, 9.5, 14.5, 18.2, 21.5, 25.2, 26.5, 23.3, 18.3, 13.9, 9.6]
        // }, {
        //     name: 'New York',
        //     data: [-0.2, 0.8, 5.7, 11.3, 17.0, 22.0, 24.8, 24.1, 20.1, 14.1, 8.6, 2.5]
        // }, {
        //     name: 'Berlin',
        //     data: [-0.9, 0.6, 3.5, 8.4, 13.5, 17.0, 18.6, 17.9, 14.3, 9.0, 3.9, 1.0]
        // }, {
        //     name: 'London',
        //     data: [3.9, 4.2, 5.7, 8.5, 11.9, 15.2, 17.0, 16.6, 14.2, 10.3, 6.6, 4.8]
        // }];



        for (var countryName in series) {
            var visible = false;
            if (defaultVisibleCountries.indexOf(countryName) > -1) {
                visible = true;
            }

            if (defaultCountries.indexOf(countryName) > -1) {
                seriesArray.push({
                    name: countryName,
                    data: series[countryName],
                    visible: visible
                });

            }

        }


        var json = {
            chart: {
                type: type
            },
            title: {

                text: "GDP per capita",
                x: -20
            },
            subtitle: {

                text: "World Bank",
                x: -20
            },
            xAxis: {
                categories: categories
            },
            yAxis: {
                title: {
                    text: 'GDP per capita'
                },
                plotLines: [{
                    value: 0,
                    width: 1,
                    color: '#808080'
                }]
            },
            tooltip: {
                valueSuffix: ''
            },
            legend: {
                layout: 'vertical',
                align: 'right',
                verticalAlign: 'middle',
                borderWidth: 0
            },
            series: seriesArray
        }


        return json;
    }

}())