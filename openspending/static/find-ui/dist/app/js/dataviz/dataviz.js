(function() {

    window.clickedIndicator = false;
    window.expandedCategory = false;

    var hashParams = window.getHashParams();
    var yearsExtremes = []; //default, will be calculated



    var activeData;
    var regionalAverageData, regionalAverageSeries;
    var regionalAverageIndex;
    var groupBy = "countries";
    var groupByRegion = false;
    var modalTitle = "";
    var modalMessage = "";

    var yearsFilter = hashParams.f.split("|");
    var indicators = hashParams.i.split("|");
    var group = hashParams.g;
    var region = hashParams.r;
    var chartType = hashParams.c;
    var countries = hashParams.cn.split("|");
    groupByRegion = parseInt(hashParams.grp);

    var statsData, statsDataSeries;

    var eventBind = function() {



        //var val = $('#filter-years').slider("option", "value");
        window.flipCardEvent();

        // $('.dropdown-toggle').dropdown();


    }

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

        activeIndicators: ko.observableArray([]),

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

        groupByRegion: ko.observable(false),

        activeRegion: ko.observable(""),

        clearActiveCountries: function() {

            model.activeCountries.removeAll();

        },

        removeIndicator: function(selectedIndicator) {

            var indicatorIndex = _.indexOf(model.activeIndicators(), selectedIndicator);
            var categoriesModel = _.clone(model.categoriesModel(), true);
            var sourcesModel = _.clone(model.sourcesModel(), true);

            model.activeIndicators.splice(indicatorIndex, 1);
            model.indicatorsModel.removeAll();
            _.forEach(model.indicatorsModelMaster(), function(indicator) {
                if (selectedIndicator.id == indicator.id) {
                    indicator.selected = !indicator.selected;
                }
                model.indicatorsModel.push(indicator);
            });


            model.categoriesModel.removeAll();
            _.forEach(categoriesModel, function(category) {
                _.forEach(category.indicators, function(indicator) {
                    if (selectedIndicator.id == indicator.id) {
                        indicator.selected = !indicator.selected;
                    }
                });
                model.categoriesModel.push(category);
            });
            //debugger;

            model.sourcesModel.removeAll();
            _.forEach(sourcesModel, function(source) {
                _.forEach(source.indicators, function(indicator) {
                    if (selectedIndicator.id == indicator.id) {

                        indicator.selected = !indicator.selected;
                    }
                });
                model.sourcesModel.push(source);
            });

            window.flipCardEvent();

        },

        selectSubcategory: function(selectedSubcategory, evt) {
            evt.stopPropagation();
            var currentTarget = evt.currentTarget;
            var displayValue = $(currentTarget).next().css("display");
            if (displayValue == "none") {
                $(currentTarget).next().css("display", "block");
            } else {
                $(currentTarget).next().css("display", "none");
            }

        },

        selectIndicatorMultiple: function(selectedIndicator, evt, direct) {



            clickedIndicator = true;

            var categoriesModel = _.clone(model.categoriesModel(), true);
            var sourcesModel = _.clone(model.sourcesModel(), true);

            model.activeIndicators.removeAll();
            model.indicatorsModel.removeAll();
            _.forEach(model.indicatorsModelMaster(), function(indicator) {
                if (selectedIndicator.id == indicator.id) {
                    indicator.selected = !indicator.selected;
                }
                if (indicator.selected) {
                    model.activeIndicators.push(indicator)
                }
                model.indicatorsModel.push(indicator);
            });

            model.categoriesModel.removeAll();
            _.forEach(categoriesModel, function(category) {
                _.forEach(category.indicators, function(indicator) {
                    if (selectedIndicator.id == indicator.id) {
                        indicator.selected = !indicator.selected;
                    }
                });
                model.categoriesModel.push(category);
            });


            model.sourcesModel.removeAll();
            _.forEach(sourcesModel, function(source) {
                _.forEach(source.indicators, function(indicator) {
                    if (selectedIndicator.id == indicator.id) {

                        indicator.selected = !indicator.selected;
                    }
                });
                model.sourcesModel.push(source);
            });

            window.flipCardEvent();

        },

        selectCountry: function(selectedCountry) {
            var selectedCountry = arguments[0];
            if (selectedCountry.selected) {
                return false;
            }
            var countryLabel = selectedCountry.label;
            var countryId = selectedCountry.iso_a2;

            model.activeCountries.push(selectedCountry);

            var countriesModelMaster = _.clone(model.countriesModelMaster(), true);
            model.countriesModelMaster.removeAll();

            var countriesModel = _.clone(model.countriesModel(), true);
            model.countriesModel.removeAll();
            _.forEach(countriesModel, function(country) {
                if (countryId == country.iso_a2) {
                    country.selected = !country.selected;
                }
                model.countriesModel.push(country);
            });

            _.forEach(countriesModelMaster, function(country) {
                if (countryId == country.iso_a2) {
                    country.selected = !country.selected;
                }
                model.countriesModelMaster.push(country);
            });
        },

        clearActiveIndicators: function() {

            model.activeIndicators.removeAll();


            var categoriesModel = _.clone(model.categoriesModel(), true);
            var sourcesModel = _.clone(model.sourcesModel(), true);


            model.indicatorsModel.removeAll();
            _.forEach(model.indicatorsModelMaster(), function(indicator) {
                indicator.selected = false;
                model.indicatorsModel.push(indicator);
            });


            model.categoriesModel.removeAll();
            _.forEach(categoriesModel, function(category) {
                _.forEach(category.indicators, function(indicator) {
                    indicator.selected = false;
                });
                model.categoriesModel.push(category);
            });
            //debugger;

            model.sourcesModel.removeAll();
            _.forEach(sourcesModel, function(source) {
                _.forEach(source.indicators, function(indicator) {
                    indicator.selected = false;
                });
                model.sourcesModel.push(source);
            });

            window.flipCardEvent();

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
            var _deferredList = window.loadIndicatorData(indicators, group, region, yearsExtremes, countries, groupByRegion);
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
            var deff = window.loadIndicatorData(indicators, _groupId, _region, yearsExtremes, _countries, groupByRegion);



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


    }

    var createYearSlider = function(minYear, maxYear) {

        //var minYear = parseInt(yearsRange[0]);
        //var maxYear = parseInt(yearsRange[1]);

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

        //debugger;
        var sortedData = window.prepareHighchartsJson(responseData[0], responseStats[0], indicatorsMeta, chartType, indicators, group, region, groupByRegion);
        var highChartsJson = sortedData.highcharts;
        //regionalAverageData = sortedData.average;

        highChartsJson.title.text = "";
        //highChartsJson.chart.type = chart;
        highChartsJson.yAxis.title.text = "";
        highChartsJson.chart.events = {
            load: function() {
                //debugger;
                var xAxis = this.series[0].xAxis;
                if (chartType == "bar") {
                    yearsFilter[0] = yearsFilter[1];
                }
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


    //deferred.done(indicatorDataLoadHandler);


    var indicatorListLoadHandler = function(response) {

        //calculate the year extremes
        /*var years = [1990, 1991, 1992, 1993, 1994, 1995, 1996, 1997, 1998, 1999, 2000, 2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014];
        debugger;
        //TODO: remove this once the years are present
        for (var indicatorId in response.data.indicators.data) {
            response.data.indicators.data[indicatorId].years = years;
        }*/

        for (var indicatorId in response.data.indicators.data) {
            var years = response.data.indicators.data[indicatorId].years;
            var yearStart = years[0];
            var yearEnd = years[years.length - 1];
            var years = response.data.indicators.data[indicatorId].years;

            if (yearsExtremes.length == 0) {

                yearsExtremes.push(yearStart);
                yearsExtremes.push(yearEnd);

            } else {

                if (yearStart < yearsExtremes[0]) {
                    yearsExtremes[0] = yearStart;
                }

                if (yearEnd > yearsExtremes[1]) {
                    yearsExtremes[1] = yearEnd;
                }
            }
        }

        if (yearsExtremes[0] < 1990) {
            yearsExtremes[0] = 1990;
        }
        //debugger;
        //create slider first
        createYearSlider(yearsExtremes[0], yearsExtremes[1]);

        window.bindIndicators(response, model);

        //now get the data
        if (indicators.length > 1) {
            //switch to group by indicators
            groupBy = "indicators";
        }
        var deferredMetaList = window.loadIndicatorsMeta(indicators);
        var deferredList = window.loadIndicatorData(indicators, group, region, yearsExtremes, countries, groupByRegion);
        deferredList = deferredList.concat(deferredMetaList);

        //$.when(deferredList[0], deferredList[1]).done(indicatorDataLoadHandler);

        $.when.apply($, deferredList).done(function(response) {
            indicatorDataLoadHandler(arguments);
        });

        eventBind();

    }

    window.loadIndicatorList(window.config.server + window.config.services.categories, indicatorListLoadHandler);


    var countriesListLoadHandler = function(response) {

        window.bindCountries(response, model);

    }

    window.loadCountries("", countriesListLoadHandler);

    initialize();

}())