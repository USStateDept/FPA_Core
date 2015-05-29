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

    window.loadIndicatorData = function(indicatorIds, groupId, region, handlerFunc) {
        if (groupId != "all") {
            var urlTemplate = "/api/slicer/cube/geometry/cubes_aggregate?cubes={indicator_id}&drilldown=geometry__country_level0@{groupId}|geometry__time@time&cut=geometry__country_level0@{groupId}:{region}"
        } else {
            var urlTemplate = "/api/slicer/cube/geometry/cubes_aggregate?cubes={indicator_id}&drilldown=geometry__time|geometry__country_level0@sovereignt&format=json"
        }
        var url = urlTemplate.replace(/{indicator_id}/g, indicatorIds.join("|"));

        url = url.replace(/{groupId}/g, groupId);
        url = url.replace(/{region}/g, region);


        //url = "data/gdp_per_capita.json";
        //gdp_per_capita
        //literacy_rate_adult_total
        //control_of_corruption

        //url = "http://finddev.edip-maps.net/api/slicer/cube/geometry/cubes_aggregate?cubes=gdp_per_capita&drilldown=geometry__time|geometry__country_level0@name&format=json"
        // url = "http://api.worldbank.org/countries/all/indicators/NY.GDP.PCAP.KD?per_page=14200&format=jsonP";
        //debugger;
        $.ajax({
            url: url,
            //jsonp: "prefix",
            //dataType: "jsonp",
            dataType: "json",
            // xhrFields: {
            //     "withCredentials": true
            // },

            data: {

            },
            success: handlerFunc
        });
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



}())