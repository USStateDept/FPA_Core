(function() {


    var hashParams = window.getHashParams();

    var yearsRange = hashParams.y.split("|");
    var yearsFilter = hashParams.f.split("|");
    var indicators = hashParams.i.split("|");
    var group = hashParams.g;
    var region = hashParams.r;
    var chart = hashParams.c;

    var activeData;
    var regionalAverageData, regionalAverageSeries;
    var regionalAverageIndex;
    var groupBy = "countries";

    var statsData, statsDataSeries;

    var model = {
        showRegionalAverage: function() {




        },

        showTable: function() {

        },

        showStats: function(type) {

            var index = 0;

            switch (type) {
                case "min":
                    index = 0;
                    break;

                case "max":
                    index = 1;
                    break;

                case "avg":
                    index = 2;
                    break;
            }

            var activeChart = $('#viz-container').highcharts();
            var series = activeChart.series[index];

            if (series.visible) {
                series.hide();
                //$button.html('Show series');
            } else {
                series.show();
                // $button.html('Hide series');
            }
        },

        showAll: function() {

            var activeChart = $('#viz-container').highcharts();
            $(activeChart.series).each(function() {
                //this.hide();
                this.setVisible(true, false);
            });
            activeChart.redraw();

        },

        hideAll: function() {

            var activeChart = $('#viz-container').highcharts();
            $(activeChart.series).each(function() {
                //this.hide();
                this.setVisible(false, false);
            });
            activeChart.redraw();

        },

        selectYear: function() {
            var yearsArray = [];
            var pickedFromDropdown = false;
            if (!(years instanceof Array)) {
                yearsArray = [years];
                pickedFromDropdown = true;
            } else {
                yearsArray = years;
            }
            model.activeYears.removeAll();

            model.activeYears(yearsArray);

            if (pickedFromDropdown) {
                $("#filter-years").slider('values', 0, years);
                $("#filter-years").slider('values', 1, years);

            }
        },

        groupBy: function(type) {

            groupBy = type;

            redrawChart(yearsFilter[0], yearsFilter[1]);

        },

        activeYears: ko.observableArray([1990, 2015])
    }

    ko.applyBindings(model);


    var initialize = function() {

        //track hash update
        window.onhashchange = function(evt) {
            var newURL = evt.newURL;
            var _hashParams = window.getHashParams();
            yearsFilter = _hashParams.f.split("|");

            redrawChart(yearsFilter[0], yearsFilter[1]);
        }
        var minYear = parseInt(yearsRange[0]);
        var maxYear = parseInt(yearsRange[1]);
        var minYearFilter = parseInt(yearsFilter[0]);
        var maxYearFilter = parseInt(yearsFilter[1]);
        $("#filter-years").slider({
            range: true,
            min: minYear,
            max: maxYear,
            values: [minYearFilter, maxYearFilter],
            change: function(event, ui) {

                //debugger;
                //var series = $('#viz-container').highcharts().series

                var startYear = ui.values[0];

                var endYear = ui.values[1];

                var yearLabel = startYear;

                if (startYear != endYear) {
                    yearLabel = startYear + "-" + endYear;
                    // model.selectYear([startYear, endYear]);
                } else {
                    // model.selectYear([startYear]);
                }

                //update hash
                var currentHash = window.getHashParams();
                currentHash.f = startYear + "|" + endYear;

                window.updateHash(currentHash);
                //redrawChart(startYear, endYear);
            },
            slide: function(event, ui) {


                // $("#filter-years-label")[0].innerHTML = ui.values[0] + " - " + ui.values[1];

            }
        }).slider("pips", {
            /* options go here as an object */
        }).slider("float", {
            /* options go here as an object */
        });
    }


    var indicatorDataLoadHandler = function(responseData, responseStats) {

        statsData = responseStats[0];

        var sortedData = window.prepareHighchartsJson(responseData[0], responseStats[0], chart, indicators, group, region, groupBy);
        var highChartsJson = sortedData.highcharts;
        //regionalAverageData = sortedData.average;

        highChartsJson.title.text = indicators[0];
        highChartsJson.chart.type = chart;
        highChartsJson.yAxis.title.text = "";
        //highChartsJson.subtitle.text = type;
        $('#viz-container').highcharts(highChartsJson);

        $("#loading").hide();
    }

    var redrawChart = function(startYear, endYear) {
        $("#loading").show();
        // debugger;
        if ($('#viz-container').highcharts()) {
            $('#viz-container').highcharts().destroy();
        };

        var _deferredList = window.loadIndicatorData(indicators, group, region, [startYear, endYear], groupBy);
        $.when(_deferredList).done(indicatorDataLoadHandler)
        //_deferred.done(indicatorDataLoadHandler);
    }

    if (indicators.length > 1) {
        //switch to group by indicators
        groupBy = "indicators";
    }
    var deferredList = window.loadIndicatorData(indicators, group, region, yearsFilter, groupBy);
    $.when(deferredList[0], deferredList[1]).done(indicatorDataLoadHandler)
    //deferred.done(indicatorDataLoadHandler);

    initialize();

}())