(function() {

    window.prepareHighchartsJson = function(data, type, indicators) {

        //var defaultCountries = ["australia", "new zealand", "sweden", "germany", "france", "ghana", "kenya", "south africa", "bangladesh", "pakistan", "cambodia"];
        //var defaultVisibleCountries = ["australia", "germany", "kenya", "cambodia"];

        var cells = data.cells;
        var indicatorId = indicators[0].id;
        var title = indicators[0].label;
        var timeCell = {};
        _.forEach(data.cell, function(c) {
            if (c.hierarchy == "time") {
                timeCell = c;
            }
        });

        var fromYear = timeCell.from[0];
        var toYear = timeCell.to[0];
        var categories = [];

        for (var i = fromYear; i <= toYear; i++) {
            categories.push(parseInt(i));
        }

        var series = {};
        var seriesArray = [];

        //debugger;

        //TODO : do this in one loop
        _.forEach(cells, function(c) {
            series[c["geometry__country_level0.name"] || c["geometry__country_level0.sovereignt"]] = []
        });
        //indicatorId = "gdp_per_capita";
        _.forEach(cells, function(c) {
            if ((c["geometry__time"] >= fromYear) && (c["geometry__time"] <= toYear)) {
                series[c["geometry__country_level0.name"] || c["geometry__country_level0.sovereignt"]].push([c["geometry__time"], c[indicatorId + "__amount_sum"]]);
            }
        });




        for (var countryName in series) {
            var visible = false;
            // if (defaultVisibleCountries.indexOf(countryName) > -1) {
            visible = true;
            //  }

            // if (defaultCountries.indexOf(countryName) > -1) {
            seriesArray.push({
                name: countryName,
                data: series[countryName],
                visible: visible
            });

            // }

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
                //categories: categories
                title: {
                    enabled: true,
                    text: 'Years'
                },
                startOnTick: true,
                endOnTick: true,
                showLastLabel: true
            },
            yAxis: {
                title: {
                    text: 'GDP per capita'
                },
                plotLines: [{
                    value: 0,
                    width: 0.25,
                    color: '#FFFFCC'
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

        var jsonScatter = {
            chart: {
                type: 'scatter',
                zoomType: 'xy'
            },
            title: {
                text: 'Height Versus Weight of 507 Individuals by Gender'
            },
            subtitle: {
                text: 'Source: Heinz  2003'
            },
            xAxis: {
                title: {
                    enabled: true,
                    text: 'Height (cm)'
                },
                startOnTick: true,
                endOnTick: true,
                showLastLabel: true
            },
            yAxis: {
                title: {
                    text: 'Weight (kg)'
                }
            },
            legend: {
                layout: 'vertical',
                align: 'left',
                verticalAlign: 'top',
                x: 100,
                y: 70,
                floating: true,
                backgroundColor: (Highcharts.theme && Highcharts.theme.legendBackgroundColor) || '#FFFFFF',
                borderWidth: 1
            },
            plotOptions: {
                scatter: {
                    marker: {
                        radius: 5,
                        states: {
                            hover: {
                                enabled: true,
                                lineColor: 'rgb(100,100,100)'
                            }
                        }
                    },
                    states: {
                        hover: {
                            marker: {
                                enabled: false
                            }
                        }
                    },
                    tooltip: {
                        headerFormat: '<b>{series.name}</b><br>',
                        pointFormat: '{point.x} cm, {point.y} kg'
                    }
                }
            },
            series: [{
                name: 'Country A',
                color: 'rgba(223, 83, 83, .5)',
                data: [
                    [2010, 51.6],
                    [2011, 59.0]
                ]

            }, {
                name: 'Country B',
                color: 'rgba(119, 152, 191, .5)',
                data: [
                    [2010, 65.6],
                    [2011, 71.8]
                ]
            }]
        }


        return json;
    }

}())