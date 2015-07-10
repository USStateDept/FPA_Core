(function() {

    //     GDP per Capita
    // http://finddev.edip-maps.net/api/slicer/cube/geometry/cubes_aggregate?cubes=gdp_per_capita&drilldown=geometry__time|geometry__country_level0@name&format=csv

    // Literacy Rate Adult Total
    // http://finddev.edip-maps.net/api/slicer/cube/geometry/cubes_aggregate?cubes=literacy_rate_adult_total&drilldown=geometry__time|geometry__country_level0@name&format=csv

    // Control of Corruption
    // http://finddev.edip-maps.net/api/slicer/cube/geometry/cubes_aggregate?cubes=control_of_corruption&drilldown=geometry__time|geometry__country_level0@name&format=csv
    window.loadIndicatorList = function(url, handlerFunc) {

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

    window.loadIndicatorData = function(indicators, geounits, yearsExtremes) {
        //http://localhost:5000/data-visualization#f=1990|2014&i=gdp_total&c=line&g=all&r=&cn=&grp=0
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
                _.forEach(regionsWithAllCountries, function(group) {
                    var groupMatch = group.indexOf(groupId + ":") == 0; //first occurence of :
                    if (groupMatch) {
                        groupRegions[groupId].push(group.split(":")[1]); //middle is region, ex dod_cmd:USCENTCOM
                    }
                });
            });

            for (groupId in groupRegions) {
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

    window.loadCountries = function(url, handlerFunc) {
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

    window.loadGeoJSON = function(type, handlerFunc) {

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

    window.loadIndicatorsMeta = function(indicators) {

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


    window.loadUrlShorten = function(url) {
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