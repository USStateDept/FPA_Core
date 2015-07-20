(function() {
    window.utils = {};

    window.utils.masterCells = [];

    window.utils.flipCardEvent = function() {

        $(".flip").click(function() {



            if (window.expandedCategory) {
                window.expandedCategory = false;
                return;
            }

            if (window.clickedIndicator) {
                window.clickedIndicator = false;
                return;
            }

            $(".flip").css("z-index", 10);
            $(this).css("z-index", 1000);
            $(".flip").find("div.list-group").removeClass("shadow");

            $(this).find("div.list-group").addClass("shadow");

            var isFlipped = $(this).find(".card").hasClass("flipped");

            $(".flip").find(".card").removeClass("flipped");
            $(".flip").removeClass("flippedCol");
            //- $(".list-group").css("display": "none");

            if (isFlipped) {
                //$(this).find(".card").removeClass("flipped");
                // $(this).find(".list-group").removeClass("show-me");

            } else {
                $(this).find(".card").addClass("flipped");
                $(this).addClass("flippedCol");

                //$(this).find(".list-group").addClass("show-me");
            }
            return true;
        });
    }

    window.utils.getHashParams = function() {

        var hashParams = {};
        var e,
            a = /\+/g, // Regex for replacing addition symbol with a space
            r = /([^&;=]+)=?([^&;]*)/g,
            d = function(s) {
                return decodeURIComponent(s.replace(a, " "));
            },
            q = window.location.hash.substring(1);

        while (e = r.exec(q))
            hashParams[d(e[1])] = d(e[2]);

        return hashParams;
    }

    window.utils.updateHash = function(hashObj) {

        var result = decodeURIComponent($.param(hashObj));
        window.location.hash = result; //console.log("fdfsd");
    }


    window.utils.bindIndicators = function(response, model) {
        //debugger;
        var categoriesAll = response.data.categories;
        var subcategoriesAll = response.data.subcategories;
        var sourcesAll = response.data.sources;
        var indicatorsAll = response.data.indicators;

        var categoriesModel = [];
        var sourcesModel = [];
        var indicatorsModel = [];

        //Sort out Categories
        for (var cat in categoriesAll.data) {

            var isOnlyCategory = function(indicatorId) {
                return indicatorsAll.data[indicatorId].subcategory === "None";
            }

            var isSubCategory = function(indicatorId) {
                return indicatorsAll.data[indicatorId].subcategory != "None";
            }

            var makeIndicator = function(indicatorId) {
                var sourceId = _.get(indicatorsAll, 'data[indicatorId].source');
                var sourceLabel = _.get(sourcesAll, 'data[sourceId].label');

                var cloneIndicator = _.clone(indicatorsAll.data[indicatorId], true);

                cloneIndicator.source = sourceLabel;
                cloneIndicator.id = indicatorId;
                cloneIndicator.selected = false;

                return cloneIndicator;
            }

            var indicatorsIdsInCategory = _.filter(categoriesAll.data[cat].indicators, _.negate(isSubCategory));

            var indicatorsIdsInSubCategory = _.filter(categoriesAll.data[cat].indicators, _.negate(isOnlyCategory));

            var indicatorsInCategory = _.map(indicatorsIdsInCategory, makeIndicator);
            var indicatorsInSubCategory = _.map(indicatorsIdsInSubCategory, makeIndicator);

            //arrange subcategories in order
            var subcategories = [];

            var subcategoriesTracker = [];

            _.forEach(indicatorsInSubCategory, function(indicator) {

                var subCatIndex = _.indexOf(subcategoriesTracker, indicator.subcategory);

                if (subCatIndex < 0) {
                    //debugger;
                    var newSubCategory = {
                        "id": indicator.subcategory,
                        "label": subcategoriesAll.data[indicator.subcategory].label,
                        "indicators": [indicator],
                        "selected": false
                    }
                    subcategoriesTracker.push(indicator.subcategory);
                    subcategories.push(newSubCategory);
                } else {
                    subcategories[subCatIndex].indicators.push(indicator);
                }

            });

            if (subcategories.length > 0 && indicatorsInCategory.length > 0) {
                var generalSubCategory = {
                    "label": "General",
                    "indicators": indicatorsInCategory,
                    "selected": false
                }
                subcategories.unshift(generalSubCategory);
            }


            //debugger;
            var newCategory = {
                "label": categoriesAll.data[cat].label,
                "length": categoriesAll.data[cat].indicators.length,
                "indicators": indicatorsInCategory,
                "subcategories": subcategories
            }



            categoriesModel.push(newCategory);

        }
        //debugger;
        //Sort out Sources
        for (var src in sourcesAll.data) {

            var indicatorsInSource = _.map(sourcesAll.data[src].indicators, function(indicatorId) {

                var categoryId = _.get(sourcesAll, 'data[indicatorId].category');
                var categoryLabel = _.get(sourcesAll, 'data[categoryId].label');

                var cloneIndicator = _.clone(indicatorsAll.data[indicatorId], true);

                cloneIndicator.source = categoryLabel;
                cloneIndicator.id = indicatorId;
                cloneIndicator.selected = false;
                return cloneIndicator;

            });

            var newSource = {
                "label": sourcesAll.data[src].label,
                "length": sourcesAll.data[src].indicators.length,
                "indicators": indicatorsInSource
            }

            sourcesModel.push(newSource);

        }
        //debugger;
        //Get the actual categories and sources
        for (var ind in indicatorsAll.data) {

            var newIndicator = indicatorsAll.data[ind];
            var sourceId = newIndicator.source;
            var categoryId = newIndicator.category;


            newIndicator.source = _.get(sourcesAll, 'data[sourceId].label');
            newIndicator.category = _.get(categoriesAll, 'data[categoryId].label');
            newIndicator.id = ind;
            newIndicator.selected = false;
            //newIndicator.popup = newIndicator.source + "<br>" + newIndicator.category;
            indicatorsModel.push(newIndicator);



        }
        // debugger;

        model.categoriesModel(categoriesModel);
        model.sourcesModel(sourcesModel);
        model.indicatorsModel(indicatorsModel);
        model.indicatorsModelMaster(_.clone(indicatorsModel, true));
    }

    window.utils.bindCountries = function(response, model) {



        var countryGroupings = _.clone(model.countryGroupings(), true);

        //push regions in country groupings
        _.forEach(countryGroupings, function(countryGroup, i) {

            var groupId = countryGroup.id;
            countryGroup.selected = false;
            countryGroup.filtered = false;
            countryGroup.geounit = groupId + ":all";

            if (countryGroup.id != "all") {
                var trackRegion = [];
                _.forEach(response.data, function(country) { //for each Country

                    //find level this country belongs to in this group
                    var region = country.regions[groupId];
                    var regionObj = {
                        id: region,
                        label: region,
                        geounit: groupId + ":" + region,
                        countries: [],
                        selected: false,
                        filtered: false
                    }

                    if (_.indexOf(trackRegion, region) < 0) {
                        trackRegion.push(region);
                        //debugger;
                        countryGroup.regions.push(regionObj);
                    }

                });
            } else {

                countryGroup.regions.push({ //push a region called All for All
                    id: "all",
                    label: "All Countries",
                    countries: [],
                    selected: false,
                    filtered: false
                });

            }


        });

        //push country in regions
        _.forEach(countryGroupings, function(countryGroup, i) {

            _.forEach(countryGroup.regions, function(region) {

                _.forEach(response.data, function(country) { //for each Country
                    var regionId = region.id;

                    var c = countryGroup;

                    if (country.regions[countryGroup.id] == regionId || regionId == "all") {
                        country.selected = false;
                        country.filtered = false;
                        country.id = country.iso_a2;
                        region.countries.push(country);
                    }

                });

            });

        });



        model.countryGroupings.removeAll();

        _.forEach(countryGroupings, function(countryGroup, i) {
            model.countryGroupings.push(countryGroup);
        });


        _.forEach(response.data, function(country) {
            country.selected = false;
        });


        model.countriesModel(response.data);
        model.countriesModelMaster(_.clone(response.data, true));

        model.activeGroup(countryGroupings[0]);
    }

    window.utils.highlightOnMap = function(model, all) {

        //var all = false;
        //if all then select all countries in countriesModel, else activeCountries

        var countries = model.countriesModel();
        var features = [];
        if (model.activeCountries().length > 0) {
            countries = model.activeCountries();
        }

        var countriesGeounit = _.map(countries, function(country) {
            return country.label;
        });


        var style = function(feature) {

                if (_.indexOf(countriesGeounit, feature.properties.sovereignt) >= 0) {

                    var polygon = L.multiPolygon(feature.geometry.coordinates);

                    features.push(polygon);
                    return {
                        weight: 2,
                        opacity: 1,
                        color: 'white',
                        dashArray: '3',
                        fillOpacity: 0.5,
                        fillColor: '#FF0000'
                    };
                } else {
                    return {
                        weight: 2,
                        opacity: 0,
                        color: 'white',
                        dashArray: '3',
                        fillOpacity: 0.0,
                        fillColor: '#666666'
                    };
                }
            }
            // debugger;
        window.map.removeLayer(geoJsonLayers["sovereignt"]);

        function onEachFeature(feature, layer) {
            // does this feature have a property named popupContent?
            if (feature.properties) {
                layer.bindPopup(feature.properties.sovereignt);
            }
        }

        geoJsonLayers["sovereignt"] = L.geoJson(window.countriesJson, {
            onEachFeature: onEachFeature,
            style: style
        });

        return;

        setTimeout(function() {

            map.addLayer(geoJsonLayers["sovereignt"]);
            /*L.geoJson(geoJsonLayers["sovereignt"].toGeoJSON(), {
                style: style,
                onEachFeature: onEachFeature
            }).addTo(window.map);*/

            var group = new L.featureGroup(features);
            var bounds = group.getBounds();


            var southWestLng = bounds._southWest.lng;
            var northEastLng = bounds._northEast.lng;

            bounds._southWest.lng = bounds._southWest.lat;
            bounds._southWest.lat = southWestLng;
            bounds._northEast.lng = bounds._northEast.lat;
            bounds._northEast.lat = northEastLng;


            map.fitBounds(bounds);
        }, 0);

    }

    window.utils.prepareHighchartsJson = function(data, statsData, indicatorsMeta, type, indicators, yearsExtremesForData) {

        //var defaultCountries = ["australia", "new zealand", "sweden", "germany", "france", "ghana", "kenya", "south africa", "bangladesh", "pakistan", "cambodia"];
        //var defaultVisibleCountries = ["australia", "germany", "kenya", "cambodia"];

        var cells = data.cells;
        //debugger;
        var statsCells = statsData.cells;
        var indicatorId = indicators[0];
        var title = indicators[0];
        //var groupId = group;
        //var cutBy = "name";
        var dataType = "avg"; //sum,avg
        var multiVariate = indicators.length > 1; //eligible for scatter plot
        // var seriesAverage = [];
        // var dataByYear = [];

        var titleArray = _.map(indicatorsMeta, function(meta) {
            return meta[0].label;
        });


        var fromYear = 1990; //timeCell.from[0];
        var toYear = 2015; //timeCell.to[0];

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

        window.utils.masterCells = window.utils.masterCells.concat(cells);

        var _cells = window.utils.masterCells;


        //debugger;
        //debugger;

        _.forEach(_cells, function(c) {
            if (c.region) {
                //dataByYear[c.year.toString()] = [];
                series[c.region] = [];
            }
        });

        _.forEach(_cells, function(c) {
            if (c.region) {
                series[c.region].push([c.year, c[indicatorId + "__amount_" + dataType]]);
                //dataByYear[c.year].push(c[indicatorId + "__amount" + dataType]);
            }
        });




        var counter = 1;
        var countriesArr = [];
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

            countriesArr.push(countryName);


            // }
        }
        //debugger;
        seriesArray[0].zIndex = seriesArray.length + 1;
        seriesArray[1].zIndex = seriesArray.length + 2;
        seriesArray[2].zIndex = seriesArray.length + 3;

        //debugger;

        var chartObj = {

            type: type
        };

        if (type == "radar") {
            chartObj.polar = true;
            chartObj["type"] = "line";
        }

        var jsonLine = {
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

        //debugger;
        // x - indicator 1
        // y indicator 2
        // one year
        // one region
        // size on bubble would be the third indicator
        // user should be able to switch between the x, y and z
        var latestYear = yearsExtremesForData[1];

        if (type == "bubble") {

            seriesArray = [];


            var indicator1 = indicators[0];
            var indicator2 = indicators[1];
            var indicator3 = indicators[2];

            //debugger;
            //debugger;
            _.forEach(statsCells, function(c) {

                if (latestYear === c.geometry__time) {

                    series["Global Minimum"] = {
                        data: [c[indicator1 + "__amount_min"], c[indicator2 + "__amount_min"], c[indicator3 + "__amount_min"]],
                        year: c.geometry__time
                    };
                    series["Global Maximum"] = {
                        data: [c[indicator1 + "__amount_max"], c[indicator2 + "__amount_max"], c[indicator3 + "__amount_max"]],
                        year: c.geometry__time
                    };
                    series["Global Average"] = {
                        data: [c[indicator1 + "__amount_avg"], c[indicator2 + "__amount_avg"], c[indicator3 + "__amount_avg"]],
                        year: c.geometry__time
                    };

                }
            });

            _.forEach(_cells, function(c) {
                if (c.region) {
                    series[c.region] = [];
                }
            });

            _.forEach(_cells, function(c) {
                if (c.region) {
                    if (latestYear == c.year) {
                        series[c.region] = {
                            year: c.year,
                            data: [c[indicator1 + "__amount_" + dataType], c[indicator2 + "__amount_" + dataType], c[indicator3 + "__amount_" + dataType]]
                        };
                    }
                }
            });

            //debugger;
            var counter = 1;
            var countriesArr = [];
            for (var countryName in series) {
                var visible = false;
                visible = true;
                seriesArray.push({
                    name: countryName,
                    data: [series[countryName].data],
                    visible: counter > 3 ? true : false,
                    zIndex: counter++
                });
            }
            //  debugger;

            var jsonBubble = {

                chart: {
                    type: 'bubble',
                    zoomType: 'xy'
                },

                title: {
                    text: ''
                },

                xAxis: {
                    //categories: categories
                    title: {
                        enabled: true,
                        text: indicatorsMeta[0][0].label
                    },
                    startOnTick: true,
                    endOnTick: true,
                    showLastLabel: true
                },
                yAxis: {
                    title: {
                        text: indicatorsMeta[1][0].label
                    }
                },
                zAxis: {
                    title: {
                        text: indicatorsMeta[2][0].label
                    }
                },

                series: seriesArray
            }



        }

        if (type == "bar") {
            //debugger;

            seriesArray = [];

            var data = [];

            //Add stats to series
            _.forEach(statsCells, function(c) {
                if (latestYear == c.geometry__time) {
                    data.push({
                        name: "Global Minimum",
                        data: [c[indicatorId + "__amount_min"]]
                    });
                    data.push({
                        name: "Global Maximum",
                        data: [c[indicatorId + "__amount_max"]]
                    });
                    data.push({
                        name: "Global Average",
                        data: [c[indicatorId + "__amount_avg"]]
                    });
                }
            });


            _.forEach(_cells, function(c) {
                if (c.region && latestYear == c.year) {
                    //data.push([c.region, c[indicatorId + "__amount_" + dataType]]);
                    data.push({
                        name: "Global Minimum",
                        data: [c[indicatorId + "__amount_" + dataType]]
                    });
                }
            });



            debugger;
            seriesArray = [{
                name: indicatorsMeta[0][0].label,
                data: data,
                dataLabels: {
                    enabled: true,
                    rotation: -90,
                    color: '#FFFFFF',
                    align: 'right',
                    format: '{point.y:.1f}', // one decimal
                    y: 10, // 10 pixels down from the top
                    style: {
                        fontSize: '13px',
                        fontFamily: 'Verdana, sans-serif'
                    }
                }
            }];

            var jsonBar = {
                chart: {
                    type: 'column'
                },
                title: {
                    text: ''
                },
                subtitle: {
                    text: ''
                },
                xAxis: {
                    type: 'category',
                    labels: {
                        rotation: -45,
                        style: {
                            fontSize: '13px',
                            fontFamily: 'Verdana, sans-serif'
                        }
                    }
                },
                yAxis: {
                    min: 0,
                    title: {
                        text: indicatorsMeta[0][0].label
                    }
                },
                legend: {
                    enabled: false
                },
                tooltip: {
                    pointFormat: indicatorsMeta[0][0].label
                },
                series: seriesArray
            }
        }



        var json;

        switch (type) {
            case "line":
                json = jsonLine;
                break;
            case "bar":
                json = jsonBar;
                break;
            case "bubble":
                json = jsonBubble;
                break;
        }

        //debugger;
        return {
            highcharts: json
            //average: seriesAverage
        };
    }

}())