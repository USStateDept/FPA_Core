(function() {


    var hashParams = window.getHashParams();

    var years = hashParams.y.split("|");
    var indicators = hashParams.i.split("|");
    var group = hashParams.g;
    var region = hashParams.r;
    var chart = hashParams.c;
    var activeData;



    var indicatorDataLoadHandler = function(response) {

        $("#filter-years").slider({
            range: true,
            min: 1990,
            max: 2015,
            values: [1990, 2015],
            change: function(event, ui) {

                var startYear = ui.values[0];
                var endYear = ui.values[1];


                var yearLabel = startYear;

                if (startYear != endYear) {
                    yearLabel = startYear + "-" + endYear;
                    // model.selectYear([startYear, endYear]);
                } else {
                    // model.selectYear([startYear]);
                }

                redrawChart(startYear, endYear);
            },
            slide: function(event, ui) {


                // $("#filter-years-label")[0].innerHTML = ui.values[0] + " - " + ui.values[1];

            }
        }).slider("pips", {
            /* options go here as an object */
        }).slider("float", {
            /* options go here as an object */
        });

        var highChartsJson = window.prepareHighchartsJson(response, chart, indicators, group, region);

        highChartsJson.title.text = indicators[0];
        highChartsJson.chart.type = chart;
        highChartsJson.yAxis.title.text = "";
        //highChartsJson.subtitle.text = type;
        $('#viz-container').highcharts(highChartsJson);
        $("#loading").hide();
    }

    var redrawChart = function(startYear, endYear) {
        $("#loading").show();

        if ($('#viz-container').highcharts()) {
            $('#viz-container').highcharts().destroy();
        };
        debugger;
        window.loadIndicatorData(indicators, group, region, [startYear, endYear]);
    }

    var deferred = window.loadIndicatorData(indicators, group, region, years);

    deferred.done(indicatorDataLoadHandler);



}())