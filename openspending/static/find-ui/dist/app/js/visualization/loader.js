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

    window.loadIndicatorData = function(indicators, groupId, region, yearRange, countries, groupBy) {
        var indicatorIds = [];

        var urlPrefix = "/api/slicer/cube/geometry/cubes_aggregate?cubes={indicator_id}";

        _.forEach(indicators, function(indicator) {
            indicatorIds.push(indicator);
        });

        urlPrefix = urlPrefix.replace(/{indicator_id}/g, indicatorIds.join("|"));

        var multiVariate = indicators.length > 1; //eligible for scatter plot

        if (groupId != "all" && (countries.length == 0 || countries[0] == "")) {
            //debugger;
            if (multiVariate) {

                if (groupBy && (groupBy == "countries")) {
                    groupId += ":name";
                }

                var urlTemplate = urlPrefix + "&drilldown=geometry__country_level0@{groupId}|geometry__time@time&cut=geometry__time:{yearFrom}-{yearTo}&order=time";

            }

            if (!multiVariate) {

                var urlTemplate = urlPrefix + "&drilldown=geometry__country_level0@{groupId}|geometry__time@time&cut=geometry__time:{yearFrom}-{yearTo}&order=time";

                // debugger;
                if (region.length > 0) {
                    urlTemplate += "&cut=geometry__country_level0@{groupId}:{region}";
                }
                //cut down to countries in this region
                //&cut=geometry__country_level0@{groupId}:{region}

                //"drilldown=geometry__country_level0@dos_region|geometry__time@time&cut=geometry__time:1990-2014&order=time
            }


            // var statsUrl = urlPrefix + "&drilldown=geometry__country_level0@{groupId}|geometry__time&cut=geometry__time:{yearFrom}-{yearTo}&order=time";

            // //to cut by country
        } else {
            //debugger;
            var urlTemplate = urlPrefix + "&drilldown=geometry__country_level0@sovereignt|geometry__time&format=json&cut=geometry__time:{yearFrom}-{yearTo}&order=time";

            // "&drilldown=geometry__time&cut=geometry__time:{yearFrom}-{yearTo}&order=time";

        }


        var statsUrl = urlPrefix + "&drilldown=geometry__time&cut=geometry__time:{yearFrom}-{yearTo}&order=time";


        if (countries.length > 0 && countries[0].length > 0) {
            //debugger;
            urlTemplate += "&cut=geometry__country_level0@name:" + countries.join(";")
        }



        var url = urlTemplate.replace(/{indicator_id}/g, indicatorIds.join("|"));
        //debugger;



        if (!yearRange[1]) {
            yearRange[1] = yearRange[0];
        }

        url = url.replace(/{groupId}/g, groupId);
        url = url.replace(/{region}/g, region);
        url = url.replace(/{yearFrom}/g, yearRange[0]);
        url = url.replace(/{yearTo}/g, yearRange[1]);


        statsUrl = statsUrl.replace(/{groupId}/g, groupId);
        statsUrl = statsUrl.replace(/{yearFrom}/g, yearRange[0]);
        statsUrl = statsUrl.replace(/{yearTo}/g, yearRange[1]);
        //debugger;

        //url = "data/gdp_per_capita.json";
        //gdp_per_capita
        //literacy_rate_adult_total
        //control_of_corruption

        //url = "http://finddev.edip-maps.net/api/slicer/cube/geometry/cubes_aggregate?cubes=gdp_per_capita&drilldown=geometry__time|geometry__country_level0@name&format=json"
        // url = "http://api.worldbank.org/countries/all/indicators/NY.GDP.PCAP.KD?per_page=14200&format=jsonP";
        //debugger;

        //stats


        var statsDeferred = $.ajax({
            url: statsUrl,
            //jsonp: "prefix",
            //dataType: "jsonp",
            dataType: "json",
            // xhrFields: {
            //     "withCredentials": true
            // },

            data: {

            }
            //success: handlerFunc
        });

        var dataDeferred = $.ajax({
            url: url,
            //jsonp: "prefix",
            //dataType: "jsonp",
            dataType: "json",
            // xhrFields: {
            //     "withCredentials": true
            // },

            data: {

            }
            //success: handlerFunc
        });
        //debugger;
        return [dataDeferred, statsDeferred];
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