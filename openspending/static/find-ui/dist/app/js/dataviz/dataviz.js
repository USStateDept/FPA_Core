(function() {


    var hashParams = window.getHashParams();

    var yearsRange = hashParams.y.split("|");
    var yearsFilter = hashParams.f.split("|");
    var indicators = hashParams.i.split("|");
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
            modalMessage = "";
            //go.usa.gov 
            // 
            var encodeUrl = "http://find.state.gov";


            if (window.location.hostname === "find.state.gov") {
                encodeUrl = window.location.href;
            }

            encodeUrl = encodeURIComponent(encodeUrl);

            var url = "https://go.usa.gov/api/shorten.jsonp?login=find&apiKey=513b798e10d6c101ac6ac7fdd405d0e7&longUrl={encodeUrl}";
            url = url.replace("{encodeUrl}", encodeUrl);

            window.loadUrlShorten(url).then(function(response) {
                modalMessage = response.response.data.entry[0].short_url;
                $('#modal').modal('show');
            });



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

            //redrawChart(yearsFilter[0], yearsFilter[1]);

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

        selectCountry: function() {
            debugger;
        },

        selectCountryGroup: function() {



            var groupId = arguments[0].id;

            //window.changeGroup(groupId);

            model.activeGroup(arguments[0]);
            model.activeRegion(""); //set active region to undefined


            model.countryGroupRegions.removeAll();


            if (groupId == "all") {
                model.selectCountryGroupRegion("all"); //just select all countries
            } else {
                //assign region to countryGroupRegion


                _.forEach(model.countryGroupings(), function(countryGroup) {
                    if (groupId == countryGroup.id) {
                        model.countryGroupRegions(_.clone(countryGroup.regions, true));
                        model.selectCountryGroupRegion(countryGroup.regions[0]);
                    }
                })

            }



        },

        selectCountryGroupRegion: function() {
            var selectedRegion = arguments[0];
            var selectedGroup = model.activeGroup();

            model.activeRegion(selectedRegion);
            model.countriesModel.removeAll();

            var countriesModelMaster = _.clone(model.countriesModelMaster(), true);

            _.forEach(countriesModelMaster, function(country) {
                if (selectedRegion == "all") {
                    model.countriesModel.push(country);
                } else if (_.has(country.regions, selectedGroup.id) && country.regions[selectedGroup.id] == selectedRegion) {
                    model.countriesModel.push(country);
                }

            })

            //filter country view by region

        },

        filterCountries: function(m, evt) {

            var charCode = evt.charCode;
            var value = evt.currentTarget.value;

            var countries = model.countriesModelMaster();
            model.countriesModel.removeAll();
            //model.newSearch(false);

            for (var x in countries) {

                if (countries[x].label.toLowerCase().indexOf(value.toLowerCase()) >= 0) {
                    model.countriesModel.push(countries[x]);
                }
            }

            return true;

        },

        redrawChart: function(indicator) {

            $("#loading").show();

            if ($('#viz-container').highcharts()) {
                $('#viz-container').highcharts().destroy();
            };

            indicators = [indicator.id];

            var _deferredMetaList = window.loadIndicatorsMeta(indicators);
            var _deferredList = window.loadIndicatorData(indicators, group, region, [1990, 2014], countries, groupBy);
            _deferredList = _deferredList.concat(_deferredMetaList);

            //var _deferredList = window.loadIndicatorData(indicators, group, region, [1990, 2014], countries, groupBy);

            $.when.apply($, _deferredList).done(function(response) {
                indicatorDataLoadHandler(arguments);
            });

            //$.when(_deferredList[0], _deferredList[1]).done(indicatorDataLoadHandler)
            //_deferred.done(indicatorDataLoadHandler);
        },

        addRegionComparator: function() {
            model.addComparator("group");
        },

        addComparator: function(obj) {

            var _groupId = "all";
            var _countries = [];
            var _groupBy;
            var _region = "";
            var cutBy = "sovereignt";

            if (!arguments[0].geounit && obj === "group") { //if region

                _groupId = model.activeGroup().id;
                _region = model.activeRegion();
                cutBy = _groupId;

            } else { // if country

                if (arguments[0].geounit) {
                    _countries = [arguments[0].geounit];
                } else {
                    _groupId = model.activeGroup().id;
                    _region = model.activeRegion();
                    _countries = [];
                }


            }

            //debugger;
            var deff = window.loadIndicatorData(indicators, _groupId, _region, [1990, 2014], _countries, groupBy);



            $.when(deff[0], deff[1]).done(function(responseData, responseStats) {
                //add to existing chart
                if (cutBy == "sovereignt") {
                    var cells = responseData[0].cells;
                } else {
                    var cells = responseStats[0].cells;
                }

                //debugger;

                var dataByYear = {};
                var series = {};
                var seriesArray = [];
                //
                //by country
                _.forEach(cells, function(c) {
                    dataByYear[c["geometry__time"].toString()] = [];
                    series[c["geometry__country_level0." + cutBy]] = []
                });

                _.forEach(cells, function(c) {
                    //if ((c["geometry__time"] >= fromYear) && (c["geometry__time"] <= toYear)) {
                    series[c["geometry__country_level0." + cutBy]].push([c["geometry__time"], c[indicators[0] + "__amount_sum"]]);
                    dataByYear[c["geometry__time"]].push(c[indicators[0] + "__amount_sum"]);
                    //}
                });


                var chart = $('#viz-container').highcharts();

                for (var countryName in series) {

                    chart.addSeries({
                        name: countryName,
                        data: series[countryName],
                        visible: true
                    }, false /*redraw*/ );



                }

                chart.redraw();




            });

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

        var columnsSortable = [];
        var cells = data.cells;

        _.forEach(cells, function(cell, i) {
            cell.id = 'id_' + i
        });
        //debugger;
        //population_growth__amount_min
        //population_growth__amount_max
        //population_growth__amount_sum
        //population_growth__amount_avg
        //geometry_time

        function DummyLinkFormatter(row, cell, value, columnDef, dataContext) {
            //return '<a href="#">' + value + '</a>';
            return value
        }

        for (var colName in cells[0]) {
            // columnTitles.push(colName);
            columnsSortable.push({
                id: colName,
                name: colName,
                field: colName,
                width: 200,
                sortable: true,
                formatter: DummyLinkFormatter
            });
        }


        var columns;
        var data;

        // Example 3: sortable, reorderable columns
        columns = columnsSortable.slice();
        data = cells.slice();

        $("#data-table").slickgrid({
            columns: columns,
            data: data,
            slickGridOptions: {
                enableCellNavigation: true,
                enableColumnReorder: true,
                forceFitColumns: true,
                rowHeight: 35
            },
            // handleCreate takes some extra options:
            sortCol: undefined,
            sortDir: true,
            handleCreate: function() {
                var o = this.wrapperOptions;
                // configure grid with client-side data view
                var dataView = new Slick.Data.DataView();
                var grid = new Slick.Grid(this.element, dataView,
                    o.columns, o.slickGridOptions);
                // sorting
                var sortCol = o.sortCol;
                var sortDir = o.sortDir;

                function comparer(a, b) {
                    var x = a[sortCol],
                        y = b[sortCol];
                    return (x == y ? 0 : (x > y ? 1 : -1));
                }
                grid.onSort.subscribe(function(e, args) {
                    sortDir = args.sortAsc;
                    sortCol = args.sortCol.field;
                    dataView.sort(comparer, sortDir);
                    grid.invalidateAllRows();
                    grid.render();
                });
                // set the initial sorting to be shown in the header
                if (sortCol) {
                    grid.setSortColumn(sortCol, sortDir);
                }
                // initialize the model after all the events have been hooked up
                dataView.beginUpdate();
                dataView.setItems(o.data);
                dataView.endUpdate();

                grid.resizeCanvas(); // XXX Why is this needed? A possible bug?
                // If this is missing, the grid will have
                // a horizontal scrollbar, and the vertical
                // scrollbar cannot be moved. A column reorder
                // action fixes the situation.

            }
        });

    }


    var indicatorDataLoadHandler = function(args) {

        var responseData = args[0];
        var responseStats = args[1];

        var indicatorsMeta = [].splice.call(args, 0);
        indicatorsMeta.shift(); //remove first two
        indicatorsMeta.shift();


        var sortedData = window.prepareHighchartsJson(responseData[0], responseStats[0], indicatorsMeta, chart, indicators, group, region, groupBy);
        var highChartsJson = sortedData.highcharts;
        //regionalAverageData = sortedData.average;

        highChartsJson.title.text = "";
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


    }

    if (indicators.length > 1) {
        //switch to group by indicators
        groupBy = "indicators";
    }
    var deferredMetaList = window.loadIndicatorsMeta(indicators);
    var deferredList = window.loadIndicatorData(indicators, group, region, yearsFilter, countries, groupBy);
    deferredList = deferredList.concat(deferredMetaList);

    //$.when(deferredList[0], deferredList[1]).done(indicatorDataLoadHandler);

    $.when.apply($, deferredList).done(function(response) {
        indicatorDataLoadHandler(arguments);
    });
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