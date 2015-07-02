(function() {

    window.prepareHighchartsJson = function(data, statsData, indicatorsMeta, type, indicators, group, region, groupByRegion) {

        //var defaultCountries = ["australia", "new zealand", "sweden", "germany", "france", "ghana", "kenya", "south africa", "bangladesh", "pakistan", "cambodia"];
        //var defaultVisibleCountries = ["australia", "germany", "kenya", "cambodia"];

        var cells = data.cells;
        var statsCells = statsData.cells;
        var indicatorId = indicators[0];
        var title = indicators[0];
        var groupId = group;
        var cutBy = "name";
        var dataType = "avg"; //sum,avg
        var multiVariate = indicators.length > 1; //eligible for scatter plot
        // var seriesAverage = [];
        var dataByYear = [];

        var titleArray = _.map(indicatorsMeta, function(meta) {
            return meta[0].label;
        });

        //
        switch (true) {
            case (groupId == "all" && !groupByRegion):
                // debugger;
                cutBy = "sovereignt";
                break;
            default:
                // debugger;
                cutBy = groupId;
                break;
        }
        //debugger;
        if (!multiVariate && region.length > 0 && !groupByRegion) {
            cutBy = "sovereignt"
        }

        //debugger;
        var timeCell = {};
        _.forEach(data.cell, function(c) {
            if (c.hierarchy == "time") {
                timeCell = c;
            }
        });

        var fromYear = timeCell.from[0];
        var toYear = timeCell.to[0];
        /*debugger;
        if (type == "bar") {
            debugger;
            // fromYear = parseInt(toYear);
            toYear = parseInt(fromYear);
        }*/
        var categories = [];

        for (var i = fromYear; i <= toYear; i++) {
            categories.push(parseInt(i));
        }

        var series = {
            "Global Minimum": [],
            "Global Maximum": [],
            "Global Average": [],
        };


        //Add stats to series

        _.forEach(statsCells, function(c) {
            //(c["geometry__time"] >= fromYear) && (c["geometry__time"] <= toYear) &&
            //if ((groupId == "all" || c["geometry__country_level0." + groupId] == region)) {
            series["Global Minimum"].push([c["geometry__time"], c[indicatorId + "__amount_min"]]);
            series["Global Maximum"].push([c["geometry__time"], c[indicatorId + "__amount_max"]]);
            series["Global Average"].push([c["geometry__time"], c[indicatorId + "__amount_avg"]]);
            // }
        });

        //debugger;
        var seriesArray = [];

        //debugger;
        //debugger;

        if (multiVariate) { // && region.length > 0 && (groupBy == "indicators")

            _.forEach(indicators, function(indicator) {
                series[indicator] = []
            });
            //indicatorId = "gdp_per_capita";
            _.forEach(cells, function(c) {
                // if ((c["geometry__time"] >= fromYear) && (c["geometry__time"] <= toYear)) {
                //rada
                _.forEach(indicators, function(indicator) {
                    //debugger;
                    if (c["geometry__country_level0." + cutBy] == region) {

                        series[indicator].push([c["geometry__time"], c[indicator + "__amount_" + dataType]])
                    }
                });

                //series[c["geometry__country_level0." + cutBy]].push();
                // }
            });
            //debugger;
        }

        //debugger;
        if (!multiVariate || region.length == 0) {
            //debugger;
            //TODO : do this in one loop
            _.forEach(cells, function(c) {
                dataByYear[c["geometry__time"].toString()] = [];
                series[c["geometry__country_level0." + cutBy]] = []
            });
            //indicatorId = "gdp_per_capita";
            _.forEach(cells, function(c) {
                //if ((c["geometry__time"] >= fromYear) && (c["geometry__time"] <= toYear)) {
                //rada
                //debugger;
                series[c["geometry__country_level0." + cutBy]].push([c["geometry__time"], c[indicatorId + "__amount_" + dataType]]);
                dataByYear[c["geometry__time"]].push(c[indicatorId + "__amount" + dataType]);
                // }
            });

            // for (var year in dataByYear) {
            //     var total = _.reduce(dataByYear[year], function(total, n) {
            //         return total + n;
            //     });
            //     var average = total / dataByYear[year].length;
            //     seriesAverage.push([parseInt(year), average]);
            // }

        }


        var counter = 1;

        for (var countryName in series) {
            var visible = false;
            // if (defaultVisibleCountries.indexOf(countryName) > -1) {
            visible = true;
            //  }
            //window.averageSeries = series[countryName];
            // if (defaultCountries.indexOf(countryName) > -1) {
            seriesArray.push({
                name: countryName,
                data: series[countryName],
                visible: counter > 3 ? true : false,
                zIndex: counter++
            });

            // }

        }

        seriesArray[0].zIndex = seriesArray.length + 1;
        seriesArray[1].zIndex = seriesArray.length + 2;
        seriesArray[2].zIndex = seriesArray.length + 3;

        //debugger;


        //debugger;

        var chartObj = {

            type: type
        };

        if (type == "radar") {
            chartObj.polar = true;
            chartObj["type"] = "line";
        }

        var json = {
            chart: chartObj,
            title: {

                text: titleArray.join(" & "),
                x: -20
            },
            subtitle: {

                text: titleArray.join(" & "),
                x: -20
            },
            xAxis: {
                //categories: categories
                title: {
                    enabled: true,
                    text: ''
                },
                startOnTick: true,
                endOnTick: true,
                showLastLabel: true
            },
            yAxis: {
                title: {
                    text: ''
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
                borderWidth: 0,
                width: 200,
                itemWidth: 100
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

        //debugger;
        return {
            highcharts: json
            //average: seriesAverage
        };
    }

}())