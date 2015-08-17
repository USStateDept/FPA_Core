(function() {
    window.loader = {};
    //     GDP per Capita
    // http://finddev.edip-maps.net/api/slicer/cube/geometry/cubes_aggregate?cubes=gdp_per_capita&drilldown=geometry__time|geometry__country_level0@name&format=csv

    // Literacy Rate Adult Total
    // http://finddev.edip-maps.net/api/slicer/cube/geometry/cubes_aggregate?cubes=literacy_rate_adult_total&drilldown=geometry__time|geometry__country_level0@name&format=csv

    // Control of Corruption
    // http://finddev.edip-maps.net/api/slicer/cube/geometry/cubes_aggregate?cubes=control_of_corruption&drilldown=geometry__time|geometry__country_level0@name&format=csv

    //var geoJsonLayers = {};
    window.loader.geoJson = {};
    window.loader.geoJsonLayers = {};
    window.loader.data = null;
    window.loader.indicator = null;

    window.loader.loadIndicatorList = function(url, handlerFunc) {

        //url = "data/indicators2.json";

        $.ajax({
            url: url,
            jsonp: "callback",
            dataType: "jsonp",
            //dataType: "json",
            data: {

            },
            success: handlerFunc
        });
    }

    window.loader.loadIndicatorData = function(indicators, geounits, yearsExtremes) {

        //line
        //http://localhost:5000/data-visualization#f=1990|2014&i=gdp_total&c=bar&r=usaid_reg:OAPA|canada

        //bar
        //http://localhost:5000/data-visualization#f=1990|2014&i=gdp_total&c=bar&r=usaid_reg:OAPA|canada

        //bubble
        //http://localhost:5000/data-visualization#f=1990|2014&i=gdp_growth|gdp_per_capita|health_expenditure_public&c=bubble&r=usaid_reg:OAPA|canada

        //dod_cmd:USCENTCOM:all|dod_cmd:USCENTCOM|dod_cmd:all|kuwait|qatar|dod_cmd:USSOUTHCOM:all|argentina

        // geounits = "dod_cmd:USCENTCOM:all|dod_cmd:USCENTCOM|dod_cmd:all|kuwait|qatar|dod_cmd:USSOUTHCOM:all|argentina".split("|");
        // geounits = "dod_cmd:USCENTCOM|dod_cmd:all|kuwait|qatar|dod_cmd:USSOUTHCOM:all|argentina".split("|");
        // geounits = "dod_cmd:USCENTCOM|kuwait|qatar|dod_cmd:USSOUTHCOM|argentina".split("|");


        var indicatorIds = indicators;


        // sort by types of geo units to drill down API calls
        var countries = _.remove(geounits, function(c) {
            return c.indexOf(":") < 0;
        });

        var groupsWithAllRegions = _.remove(geounits, function(c) {
            return c.match(/:+/g).length == 1 && c.indexOf(":all") == c.length - 4; //4 is the length of :all
        });

        var regionsWithAllCountries = _.remove(geounits, function(c) {
            return c.match(/:+/g).length == 2 && c.indexOf(":all") == c.length - 4; //4 is the length of :all
        });

        var regionsInGroups = geounits;

        //////////////////////////////////////////////



        var urlPrefix = "/api/slicer/cube/geometry/cubes_aggregate?cubes={indicator_id}&cut=geometry__time:{yearFrom}-{yearTo}&order=time";
        urlPrefix = urlPrefix.replace(/{indicator_id}/g, indicatorIds.join("|"));
        urlPrefix = urlPrefix.replace(/{yearFrom}/g, yearsExtremes[0]);
        urlPrefix = urlPrefix.replace(/{yearTo}/g, yearsExtremes[1]);

        var urlCountriesTemplate = urlPrefix + "&drilldown=geometry__country_level0@name|geometry__time&cut=geometry__country_level0@name:{countries}"; //argentina;albania;india

        var urlAllRegionsInGroupTemplate = urlPrefix + "&drilldown=geometry__country_level0@{groupId}|geometry__time";

        var urlRegionsInGroupTemplate = urlPrefix + "&drilldown=geometry__country_level0@{groupId}|geometry__time&cut=geometry__country_level0@{groupId}:{regions}";

        var urlAllCountriesInRegionsInGroupTemplate = urlPrefix + "&drilldown=geometry__country_level0@name|geometry__time&cut=geometry__country_level0@{groupId}:{regions}";

        //Individual Countries
        //http://localhost:5000/api/slicer/cube/geometry/cubes_aggregate?cubes=gdp_per_capita&cut=geometry__time:1990-2014&order=time&drilldown=geometry__country_level0@name|geometry__time&cut=geometry__country_level0@name:argentina;albania;india

        //Regions in a group 
        //http://localhost:5000/api/slicer/cube/geometry/cubes_aggregate?cubes=gdp_per_capita&cut=geometry__time:1990-2014&order=time&drilldown=geometry__country_level0@dos_region|geometry__time&cut=geometry__country_level0@dos_region:EUR;SCA

        //All Countries in one or many regions of a group
        //http://localhost:5000/api/slicer/cube/geometry/cubes_aggregate?cubes=gdp_per_capita&cut=geometry__time:1990-2014&order=time&drilldown=geometry__country_level0@name|geometry__time&cut=geometry__country_level0@dos_region:EUR;SCA

        //all regions in a group
        //http://localhost:5000/api/slicer/cube/geometry/cubes_aggregate?cubes=gdp_per_capita&cut=geometry__time:1990-2014&order=time&drilldown=geometry__country_level0@dos_region|geometry__time


        var urls = [];

        if (countries.length) {
            urls.push({
                url: urlCountriesTemplate.replace(/{countries}/g, countries.join(";")),
                level: "countries",
                geounits: countries
            });
        }

        if (groupsWithAllRegions.length) {
            //debugger;
            _.forEach(groupsWithAllRegions, function(group) {
                var groupId = group.substring(0, group.indexOf(":all"));
                urls.push({
                    url: urlAllRegionsInGroupTemplate.replace(/{groupId}/g, groupId),
                    level: "regions",
                    geounits: groupId
                });
            });

        }

        if (regionsWithAllCountries.length) {
            //debugger;
            //first get all groups together
            var groups = [],
                groupRegions = {};

            _.forEach(regionsWithAllCountries, function(group) {
                var groupId = group.substring(0, group.indexOf(":")); //first occurence of :
                if (_.indexOf(groups, groupId) < 0) {
                    groups.push(groupId);
                }
            });

            _.forEach(groups, function(groupId) {
                groupRegions[groupId] = [];
                _.forEach(regionsWithAllCountries, function(group) {
                    var groupMatch = group.indexOf(groupId + ":") == 0; //first occurence of :
                    if (groupMatch) {
                        groupRegions[groupId].push(group.split(":")[1]); //middle is region, ex dod_cmd:USCENTCOM:all
                    }
                });
            });

            for (groupId in groupRegions) {



                urls.push({
                    url: urlAllCountriesInRegionsInGroupTemplate.replace(/{groupId}/g, groupId).replace(/{regions}/g, groupRegions[groupId].join(";")),
                    level: "countries",
                    geounits: groupRegions[groupId]
                });
            }

        }

        if (regionsInGroups.length) {

            //first get all groups together
            var groups = [],
                groupRegions = {};

            _.forEach(regionsInGroups, function(group) {
                var groupId = group.substring(0, group.indexOf(":")); //first occurence of :
                if (_.indexOf(groups, groupId) < 0) {
                    groups.push(groupId);
                }
            });

            _.forEach(groups, function(groupId) {
                groupRegions[groupId] = [];
                _.forEach(regionsInGroups, function(group) {
                    var groupMatch = group.indexOf(groupId + ":") == 0; //first occurence of :

                    if (groupMatch) {
                        groupRegions[groupId].push(group.split(":")[1]); //middle is region, ex dod_cmd:USCENTCOM
                    }
                });
            });

            for (groupId in groupRegions) {
                //hack since EUR shoudl be replaced with EUR;EUR
                if (groupRegions[groupId].length == 1) {
                    groupRegions[groupId][0] += ";" + groupRegions[groupId][0];
                }
                urls.push({
                    url: urlRegionsInGroupTemplate.replace(/{groupId}/g, groupId).replace(/{regions}/g, groupRegions[groupId].join(";")),
                    level: "regions",
                    geounits: groupRegions[groupId]
                });
            }

        }

        urls.push({
            url: urlPrefix + "&drilldown=geometry__time",
            level: "statistics",
            geounits: "global"
        });
        //debugger;
        var defferreds = [];

        _.forEach(urls, function(item) {
            var d = $.ajax({
                url: item.url,
                dataType: "json",
                data: {

                }
            });
            defferreds.push(d);

        });

        return defferreds;

    }

    window.loader.loadCountries = function(url, handlerFunc) {
        // url = "data/access-to-improved.json";
        //url = "static/find-ui/dist/data/countries.json";
        url = "/api/3/countries_list";
        $.ajax({
            url: url,
            // jsonp: "prefix",
            dataType: "json",
            data: {

            },
            success: handlerFunc
        });
    }

    window.loader.changeGroup = function(groupId) {
        console.log(window.loader.data);

        if (groupId == "all") {
            groupId = "sovereignt";
        }

        if (!window.loader.geoJsonLayers[groupId]) {
            window.loader.loadGeoJSON(groupId, geoJSONHandler);
        } else {
            //debugger;
            //move this layer on top
            //TODO: Leroy
        }

    }

    // add indicator data to geojson to render thematically

    var addDataToGeoJson = function(lastGeoJson) {

        var data = window.loader.data;
        var gjson = lastGeoJson;

        var hashParams = window.utils.getHashParams();
        var yearsFilter = hashParams.f.split("|");
        var indicators = hashParams.i.split("|");
        var onlyIndicator = indicators[0];
        var regions = hashParams.r.split("|");
        var maxYear = 2013; //yearsFilter[1];

        var dataByRegion = {};
        _.map(regions, function(_r) {
            dataByRegion[_r] = 0;
        })

        _.map(data.cells, function(_c) {
            if (_c.year == parseInt(maxYear)) {
                dataByRegion[_c.region] = _c[onlyIndicator + "__amount_avg"];
            }
        });


        //console.log("data");
        //console.log(data);
        //console.log(gjson);

        //what is - 3?

        //Select the value based on year
        // var currentYear = yearsExtremes



        // var fifteen = data.cells[data.cells.length - 3];
        // var region = fifteen.region;
        // var regionCapitalized = fifteen.region.charAt(0).toUpperCase() + fifteen.region.substring(1);
        // var indicator = JSON.stringify(data.cells[data.cells.length - 1]);
        // indicator = indicator.substring(2, indicator.indexOf(':') - 1);
        // var indicatorVal = fifteen[indicator];

        // var countries = gjson.features;

        //countries=countries.toLowerCase();
        //gjson.features[0].properties["economic_gender_gap__amount_avg"]=null
        //debugger;
        for (var i = 0; i < gjson.features.length; i++) {
            var _r = gjson.features[i].properties.sovereignt.toLowerCase();
            if (_.indexOf(regions, _r) > -1) {
                gjson.features[i].properties[onlyIndicator] = dataByRegion[_r];
            }
            /*if (gjson.features[i].properties.sovereignt == regionCapitalized) {
                gjson.features[i].properties[indicator] = indicatorVal;
            }*/
        }

        window.loader.lastGeoJson = gjson;
        window.loader.indicator = onlyIndicator; //indicator;
        console.log(window.loader.lastGeoJson);
        // debugger;
    }

    var geoJSONHandler = function(response, type) {


        function onEachFeature(feature, layer) {

            if (feature.properties) {
                // console.log(feature.properties);
                var name = feature.properties.sovereignt || feature.properties.usaid_reg || feature.properties.continent || feature.properties.dod_cmd || feature.properties.dos_region || feature.properties.wb_inc_lvl;
                layer.bindPopup(name);
            }
        }

        window.loader.lastGeoJson = response;

        addDataToGeoJson(window.loader.lastGeoJson);

        //if (!window.visualization.geoJsonLayers[type]) {
        //if layer doesnt exist then add it and symbolize as invisible 
        window.loader.geoJson[type] = response;

        window.loader.geoJsonLayers[type] = L.geoJson(response, {
            style: {

                weight: 0, //no border
                opacity: 1,
                color: 'gray',
                //dashArray: '3',
                fillOpacity: 0.0, //DO NOT DISLAY
                fillColor: '#cccccc'
            },
            onEachFeature: onEachFeature
        });

        for (var _type in window.loader.geoJsonLayers) {
            if (type == _type) {
                map.addLayer(window.loader.geoJsonLayers[_type]);
            }
        }


        var url = window.location.href;

        countryIndex = url.indexOf("r=") + 2;

        var country = url.substring(countryIndex);
        //console.log(country);
        var region = null;
        if (country.indexOf('|') > -1) {

            countries = country.split('|');

            for (var i = 0; i < countries.length; i++) {
                var currentCountry = countries[i];
                window.utils.highlightOnMapViz(currentCountry, region, window.loader.lastGeoJson);
            }
        } else {
            window.utils.highlightOnMapViz(country, region, window.loader.lastGeoJson);
        }
    }

    window.loader.loadGeoJSON = function(type, handlerFunc) {

        url = "/static/json/" + type + "_None.geojson";
        $.ajax({
            url: url,
            // jsonp: "prefix",
            dataType: "json",
            data: {

            },
            success: function(response) {
                handlerFunc(response, type)
            }
        });

    }

    window.loader.loadIndicatorsMeta = function(indicators) {

        var defferreds = [];

        _.forEach(indicators, function(indicator) {

            var url = "/api/3/datasets/" + indicator;

            var deferred = $.ajax({

                url: url,

                dataType: "json",

                data: {

                }

            });

            defferreds.push(deferred);

        })

        return defferreds;
        //http://finddev.edip-maps.net/api/3/datasets/cost_to_import
    }


    window.loader.loadUrlShorten = function(url) {
        var deferred = $.ajax({

            url: url,

            dataType: "jsonp",

            jsonp: "callback",

            data: {

            }

        });

        return deferred;
    }



}())