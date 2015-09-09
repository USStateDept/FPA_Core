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

        var urlPrefix = "/api/slicer/cube/geometry/cubes_aggregate?&cluster=jenks&numclusters=4&cubes={indicator_id}&cut=geometry__time:{yearFrom}-{yearTo}&order=time";
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

        var defferreds = [];

        function getDataFromServer(a) {
          var toPush = false;

          var d = $.ajax({
             url: a.url,
             dataType: "json",
             data: {}
           }).done(function( res ) {
             // push to defferreds
            // console.log("SUCCESS getting data" + res);
           }).fail(function( jqXHR, textStatus, errorThrown ) {
             // failure
             //console.log("FAILURE getting data ... RETRYING");
          });

          defferreds.push(d);
        }

        _.forEach(urls, function(item) {
            getDataFromServer(item);
        });

        return defferreds;

    }

    // remove in favor of loading directly from template as variable
    // window.loader.loadCountries = function(model) {
    //     url = "/api/3/countries_list";
    //     $.ajax({
    //         url: url,
    //         // jsonp: "prefix",
    //         dataType: "json",
    //         data: {

    //         },
    //         success: handlerFunc
    //     });
    // };

    /*window.loader.changeGroup = function(groupId) {
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

    }*/

    // add indicator data to geojson to render thematically


    /*
    var geoJSONHandler = function(response, type) {

        var hashParams = window.utils.getHashParams();
        var yearsFilter = hashParams.f.split("|");
        var indicators = hashParams.i.split("|");
        var onlyIndicator = indicators[0];
        var regions = hashParams.r.split("|");
        var maxYear = 2013; //yearsFilter[1];

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

        //HIGHLIGHT EACH REGION
        var featuresAdded = [];
        _.forEach(regions, function(_r) {
            window.utils.highlightOnMapViz(_r, onlyIndicator, window.loader.lastGeoJson, featuresAdded);
        });

        window.utils.zoomToFeatures(featuresAdded);

    }*/

    window.loader.loadGeoJSON = function(type, handlerFunc, cluster) {

        url = "/static/json/" + type + "_None.geojson";
        $.ajax({
            url: url,
            // jsonp: "prefix",
            dataType: "json",
            data: {

            },
            success: function(response) {
                handlerFunc(response, type, cluster)
            }
        });

    }

    window.loader.loadIndicatorsMeta = function(indicators) {

        var defferreds = [];

        function getMetaFromServer(a) {
          var d = $.ajax({
             url: "/api/3/datasets/" + a,
             dataType: "json",
             data: {}
           }).done(function( res ) {
             // success
             //console.log("pushing meta onto defferreds");
           }).fail(function( jqXHR, textStatus, errorThrown ) {
             // failure
             console.log("FAILURE getting meta ... RETRYING");
             getMetaFromServer(a);
         });

         // push to defferreds
         defferreds.push(d);
       }

      _.forEach(indicators, function(indicator) {
        getMetaFromServer(indicator);
      });

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
