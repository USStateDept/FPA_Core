(function() {
    window.utils = {};

    window.flipCardEvent = function() {

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

    window.getHashParams = function() {

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

    window.updateHash = function(hashObj) {

        var result = decodeURIComponent($.param(hashObj));
        window.location.hash = result; //console.log("fdfsd");
    }


    window.bindIndicators = function(response, model) {
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

    window.bindCountries = function(response, model) {



        var countryGroupings = _.clone(model.countryGroupings(), true);

        //push regions in country groupings
        _.forEach(countryGroupings, function(countryGroup, i) {

            var groupId = countryGroup.id;
            countryGroup.selected = false;
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
                        selected: false
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
                    selected: false
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

    window.utils.prepareHighchartsJson = function(data, statsData, indicatorsMeta, type, indicators, group, region, groupByRegion) {

        //var defaultCountries = ["australia", "new zealand", "sweden", "germany", "france", "ghana", "kenya", "south africa", "bangladesh", "pakistan", "cambodia"];
        //var defaultVisibleCountries = ["australia", "germany", "kenya", "cambodia"];

        var cells = data.cells;
        //debugger;
        var statsCells = statsData.cells;
        var indicatorId = indicators[0];
        var title = indicators[0];
        var groupId = group;
        //var cutBy = "name";
        var dataType = "avg"; //sum,avg
        var multiVariate = indicators.length > 1; //eligible for scatter plot
        // var seriesAverage = [];
        var dataByYear = [];

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

        //debugger;
        //debugger;

        _.forEach(cells, function(c) {
            if (c.region) {
                dataByYear[c.year.toString()] = [];
                series[c.region] = [];
            }
        });

        _.forEach(cells, function(c) {
            if (c.region) {
                series[c.region].push([c.year, c[indicatorId + "__amount_" + dataType]]);
                dataByYear[c.year].push(c[indicatorId + "__amount" + dataType]);
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

        var jsonBubble = {

            chart: {
                type: 'bubble',
                zoomType: 'xy'
            },

            title: {
                text: 'Highcharts Bubbles'
            },

            series: [{
                data: [
                    [97, 36, 79],
                    [94, 74, 60],
                    [68, 76, 58],
                    [64, 87, 56],
                    [68, 27, 73],
                    [74, 99, 42],
                    [7, 93, 87],
                    [51, 69, 40],
                    [38, 23, 33],
                    [57, 86, 31]
                ]
            }, {
                data: [
                    [25, 10, 87],
                    [2, 75, 59],
                    [11, 54, 8],
                    [86, 55, 93],
                    [5, 3, 58],
                    [90, 63, 44],
                    [91, 33, 17],
                    [97, 3, 56],
                    [15, 67, 48],
                    [54, 25, 81]
                ]
            }, {
                data: [
                    [47, 47, 21],
                    [20, 12, 4],
                    [6, 76, 91],
                    [38, 30, 60],
                    [57, 98, 64],
                    [61, 17, 80],
                    [83, 60, 13],
                    [67, 78, 75],
                    [64, 12, 10],
                    [30, 77, 82]
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