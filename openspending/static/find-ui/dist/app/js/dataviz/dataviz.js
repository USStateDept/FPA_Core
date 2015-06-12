(function() {


    var hashParams = window.getHashParams();

    var yearsRange = hashParams.y.split("|");
    var yearsFilter = hashParams.f.split("|");
    var indicators = hashParams.i.split("|");
    var indicatorsLabel = hashParams.l.split("|");
    var group = hashParams.g;
    var region = hashParams.r;
    var chart = hashParams.c;
    var countries = hashParams.cn.split("|");

    var activeData;
    var regionalAverageData, regionalAverageSeries;
    var regionalAverageIndex;
    var groupBy = "countries";
    var modalTitle = "";
    var modalMessage = "";

    var statsData, statsDataSeries;

    $('#modal').modal({
        show: false,
        keyboard: false
    }); // initialized with defaults


    $('#modal').on('show.bs.modal', function(event) {
        var modal = $(this)
        modal.find('.modal-title').text(modalTitle);
        modal.find('.modal-body').text(modalMessage);
    });

    var model = {

        shareUrl: function() {

            modalTitle = "Share";
            modalMessage = "http://shareme.gov/Uns87nG";

            $('#modal').modal('show');


        },

        shareFacebook: function() {

            debugger;

        },

        shareTwitter: function() {

            debugger;

        },

        showRegionalAverage: function() {




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

        activeYears: ko.observableArray([1990, 2014]),

        categoriesModel: ko.observableArray([]),

        sourcesModel: ko.observableArray([]),

        indicatorsModel: ko.observableArray([]),

        indicatorsModelMaster: ko.observableArray([]),

        filterIndicators: function(m, evt) {
            var charCode = evt.charCode;
            var value = evt.currentTarget.value;

            var indicators = model.indicatorsModelMaster();
            model.indicatorsModel.removeAll();
            //model.newSearch(false);

            for (var x in indicators) {

                if (indicators[x].label.toLowerCase().indexOf(value.toLowerCase()) >= 0) {
                    model.indicatorsModel.push(indicators[x]);
                }
            }

            return true;

        },

        countriesModel: ko.observableArray([]),

        countriesModelMaster: ko.observableArray([]),

        countryGroupings: ko.observableArray([{
            "id": "all",
            "label": "All",
            "regions": []
        }, {
            "id": "continent",
            "label": "Continent",
            "regions": []
        }, {
            "id": "dod_cmd",
            "label": "Department of Defense",
            "regions": []
        }, {
            "id": "dos_region",
            "label": "Department of State",
            "regions": []
        }, {
            "id": "usaid_reg",
            "label": "USAID",
            "regions": []
        }, {
            "id": "wb_inc_lvl",
            "label": "World Bank",
            "regions": []
        }]),

        countryGroupRegions: ko.observableArray([]),

        activeCountries: ko.observableArray([]),

        activeGroup: ko.observable({
            "id": "all",
            "label": "All",
            "regions": []
        }),

        activeRegion: ko.observable(""),

        clearActiveCountries: function() {

            model.activeCountries.removeAll();

        },

        filterCountries: function(m, evt) {

            var charCode = evt.charCode;
            var value = evt.currentTarget.value;

            var countries = vizModel.countriesModelMaster();
            vizModel.countriesModel.removeAll();
            //model.newSearch(false);

            for (var x in countries) {

                if (countries[x].label.toLowerCase().indexOf(value.toLowerCase()) >= 0) {
                    vizModel.countriesModel.push(countries[x]);
                }
            }

            return true;

        }
    }

    ko.applyBindings(model);


    var initialize = function() {

        //track hash update
        window.onhashchange = function(evt) {
            var newURL = evt.newURL;
            var _hashParams = window.getHashParams();
            yearsFilter = _hashParams.f.split("|");

            setExtremes(yearsFilter[0], yearsFilter[1]);
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

    var showTable = function(data) {
        //debugger;
        //get colum names from cells
        var columnTitles = [];
        var columnValues = [];
        var cells = data.cells;

        for (var colName in cells[0]) {
            columnTitles.push(colName)
        }

        _.each(cells, function(cell) {
            var row = [];
            for (var colName in cell) {
                row.push(cell[colName]);
            }
            columnValues.push(row);
        });


        var block = $('#data-table')
            .TidyTable({
                enableCheckbox: false,
                enableMenu: false
            }, {
                columnTitles: columnTitles,
                columnValues: columnValues,

                // do something with selected results
                // menuOptions: [
                //     // ['Option 1', {
                //     //     callback: doSomething1
                //     // }],
                //     // ['Option 2', {
                //     //     callback: doSomething2
                //     // }]
                // ],

                // post-process DOM elements
                postProcess: {
                    // table: doSomething3,
                    // column: doSomething4,
                    // menu: doSomething5
                },

                // pre-process column values before sort (optional)
                sortByPattern: function(col_num, val) {
                    if (col_num != 1) return val;

                    return String(val).replace(/$|%|#/g, '');
                }
            });

        // copy the table options menu
        var menu = $('select.tidy_table', block).clone(true);
        block.append(menu);

        // optional animation
        block.slideDown('fast');

        // remove stored data
        block.TidyTable('destroy');
    }


    var indicatorDataLoadHandler = function(responseData, responseStats) {


        statsData = responseStats[0];

        var sortedData = window.prepareHighchartsJson(responseData[0], responseStats[0], chart, indicators, group, region, groupBy);
        var highChartsJson = sortedData.highcharts;
        //regionalAverageData = sortedData.average;

        highChartsJson.title.text = indicatorsLabel.join(" & ");
        //highChartsJson.chart.type = chart;
        highChartsJson.yAxis.title.text = "";
        highChartsJson.chart.events = {
            load: function() {
                //debugger;
                var xAxis = this.series[0].xAxis;

                xAxis.setExtremes(yearsFilter[0], yearsFilter[1]);

                $("#loading").hide();
            }
        }
        //debugger;
        //highChartsJson.subtitle.text = type;
        var chart = $('#viz-container').highcharts(highChartsJson);





        showTable(responseData[0]);
    }
    var useNarrowExtremes = true;

    var setExtremes = function(startYear, endYear) {
        //$("#loading").show();

        var chart = $('#viz-container').highcharts();
        var xAxis = chart.series[0].xAxis;

        xAxis.setExtremes(startYear, endYear);

        // return;

        // var xAxis = chart.series[0].xAxis,
        //     extremes = xAxis.getExtremes(),
        //     span = extremes.max - extremes.min,
        //     center = (extremes.min + extremes.max) / 2,
        //     newMin = center - span / 4,
        //     newMax = center + span / 4;

        // if (useNarrowExtremes) {
        //     xAxis.setExtremes(newMin, newMax);
        // } else {
        //     xAxis.setExtremes();
        // }

        // useNarrowExtremes = !useNarrowExtremes;



        // return;
        // // debugger;
        // if ($('#viz-container').highcharts()) {
        //     $('#viz-container').highcharts().destroy();
        // };

        // var _deferredList = window.loadIndicatorData(indicators, group, region, [startYear, endYear], countries, groupBy);
        // $.when(_deferredList[0], _deferredList[1]).done(indicatorDataLoadHandler)
        //_deferred.done(indicatorDataLoadHandler);
    }

    if (indicators.length > 1) {
        //switch to group by indicators
        groupBy = "indicators";
    }
    var deferredList = window.loadIndicatorData(indicators, group, region, yearsFilter, countries, groupBy);
    $.when(deferredList[0], deferredList[1]).done(indicatorDataLoadHandler)
    //deferred.done(indicatorDataLoadHandler);


    var indicatorListLoadHandler = function(response) {

        window.bindIndicators(response, model);

    }

    window.loadIndicatorList(window.config.server + window.config.services.categories, indicatorListLoadHandler);


    var countriesListLoadHandler = function(response) {

        window.bindCountries(response, model);

    }

    window.loadCountries("", countriesListLoadHandler);

    initialize();

}())