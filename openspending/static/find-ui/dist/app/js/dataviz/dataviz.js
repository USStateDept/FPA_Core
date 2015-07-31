(function() {

    window.clickedIndicator = false;
    window.expandedCategory = false;

    var hashParams = window.utils.getHashParams();
    var yearsExtremes = []; //default, will be calculated
    var yearsExtremesForData = [];
    var indicatorsMeta;

    var activeData;
    var regionalAverageData, regionalAverageSeries;
    var regionalAverageIndex;
    //var groupBy = "countries";
    //var groupByRegion = false;
    var modalTitle = "";
    var modalMessage = "";

    var yearsFilter = hashParams.f.split("|");
    var indicators = hashParams.i.split("|");
    //var group = hashParams.g;
    //var region = hashParams.r;
    var chartType = hashParams.c;
    var regions = hashParams.r.split("|");
    //groupByRegion = parseInt(hashParams.grp);

    var statsData, statsDataSeries;

    var eventBind = function() {
        //var val = $('#filter-years').slider("option", "value");
        window.utils.flipCardEvent();
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

    $('#opener').on('click', function() {
        var panel = $('#slide-panel');
        if (panel.hasClass("visible")) {
            panel.removeClass('visible').animate({
                'margin-left': '-400px'
            });
        } else {
            panel.addClass('visible').animate({
                'margin-left': '0px'
            });
        }
        return false;
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

            window.loader.loadUrlShorten(url).then(function(response) {
                modalTitle = "Share";
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

        saveVZ: function() {

            var viz_hash = encodeURI(location.hash).substring(1);
            if (viz_hash != "") {
                $.get("/user/adddv?h=" + viz_hash, function() {
                    //update some sort of flash message here? 
                });
            } else {
                //failure message here?               
            }
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

            var countriesModelMaster = _.clone(model.countriesModelMaster(), true);
            model.countriesModelMaster.removeAll();

            var countriesModel = _.clone(model.countriesModel(), true);
            model.countriesModel.removeAll();
            _.forEach(countriesModel, function(country) {
                country.selected = false;
                model.countriesModel.push(country);
            });

            _.forEach(countriesModelMaster, function(country) {
                country.selected = false;
                model.countriesModelMaster.push(country);
            });



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

            window.utils.flipCardEvent();

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

            window.utils.flipCardEvent();

        },

        selectCountry: function(selectedCountry, evt, goToVisualize, breakdown) {
            var isGroup = selectedCountry.geounit.indexOf(":all") == selectedCountry.geounit.length - 4;

            selectedCountry = _.clone(selectedCountry, true);

            if (isGroup) { //breakdown a group
                selectedCountry.label += " Regions";
            }

            if (!isGroup && breakdown) { //breakdown a region
                selectedCountry.label += " Countries";
                selectedCountry.geounit += ":all";
            }

            if (goToVisualize) {
                //TODO: Calculate Year Extremes
                window.location.href = "data-visualization#f=1990|2014&i=gdp_per_capita&c=line&r=" + selectedCountry.geounit
                return;
            }

            // var selectedCountry = arguments[0];
            if (selectedCountry.selected) {
                return false;
            }
            var countryLabel = selectedCountry.label;
            var countryId = selectedCountry.id;

            model.activeCountries.push(selectedCountry);

            var countriesModelMaster = _.clone(model.countriesModelMaster(), true);
            model.countriesModelMaster.removeAll();


            var countryGroupings = _.clone(model.countryGroupings(), true);
            model.countryGroupings.removeAll();

            var activeGroupId = model.activeGroup().id;

            _.forEach(countryGroupings, function(countryGroup, i) {
                if (countryGroup.id == countryId) {
                    countryGroup.selected = true;
                }
                _.forEach(countryGroup.regions, function(region) {
                    if (region.id == countryId && region.label == countryLabel) {
                        region.selected = true;
                    }
                    _.forEach(region.countries, function(country) { //for each Country
                        if (country.id == countryId) {
                            country.selected = true;
                        }
                    });

                });
            });

            _.forEach(countryGroupings, function(countryGroup, i) {
                if (activeGroupId == countryGroup.id) {
                    model.activeGroup(countryGroup);
                }
                model.countryGroupings.push(countryGroup);
            });


            var filterValue = $("#filterCountries")[0].value;


            model.filterCountries(null, {
                currentTarget: {
                    value: filterValue
                }
            });
        },

        removeCountry: function() {

            var selectedCountry = arguments[0];
            var activeCountries = model.activeCountries();
            var selectedIndex = _.indexOf(activeCountries, selectedCountry);

            model.activeCountries.splice(selectedIndex, 1);

            var countryLabel = selectedCountry.label;
            var countryId = selectedCountry.id;

            //model.activeCountries.removeAll();

            var countryGroupings = _.clone(model.countryGroupings(), true);
            model.countryGroupings.removeAll();

            var activeGroupId = model.activeGroup().id;
            // debugger;
            _.forEach(countryGroupings, function(countryGroup, i) {
                if (countryGroup.id == countryId) {
                    countryGroup.selected = false;
                }
                _.forEach(countryGroup.regions, function(region) {
                    if (region.id == countryId && region.label == countryLabel) {
                        region.selected = false;
                    }
                    _.forEach(region.countries, function(country) { //for each Country
                        if (country.id == countryId) {
                            country.selected = false;
                        }
                    });

                });
            });

            _.forEach(countryGroupings, function(countryGroup, i) {
                if (activeGroupId == countryGroup.id) {
                    model.activeGroup(countryGroup);
                }
                model.countryGroupings.push(countryGroup);
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

            window.utils.flipCardEvent();

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

            //indicators = [indicator.id];
            indicators = _.map(model.activeIndicators(), function(indicator) {
                return indicator.id;
            });

            var _deferredMetaList = window.loader.loadIndicatorsMeta(indicators);
            var _deferredList = window.loader.loadIndicatorData(indicators, group, region, yearsExtremes, countries, groupByRegion);
            _deferredList = _deferredList.concat(_deferredMetaList);

            //var _deferredList = window.loader.loadIndicatorData(indicators, group, region, [1990, 2014], countries, groupBy);

            $.when.apply($, _deferredList).done(function(response) {
                indicatorDataLoadHandler(arguments);
            });

            //$.when(_deferredList[0], _deferredList[1]).done(indicatorDataLoadHandler)
            //_deferred.done(indicatorDataLoadHandler);
        },

        addRegionComparator: function() {
            model.addComparator("group");
        },

        addComparator: function(model) {
            debugger;
            model.countryGroup();
            debugger;
            // var _groupId = "all";
            // var _countries = [];
            // var _groupBy;
            // var _region = "";
            // var cutBy = "sovereignt";
            // var groupByRegion = model.groupByRegion();

            // _countries = _.map(model.activeCountries(), function(country) {
            //     return country.geounit;
            // })

            // if (groupByRegion) { //if region

            //     _groupId = model.activeGroup().id;
            //     _region = model.activeRegion();
            //     cutBy = _groupId;

            // } else { // if country

            //     if (!_countries.length) {
            //         _groupId = model.activeGroup().id;
            //         _region = model.activeRegion();
            //         _countries = [];
            //     }


            // }
            // cutBy;
            // //debugger;
            // var deff = window.loader.loadIndicatorData(indicators, _groupId, _region, yearsExtremes, _countries, groupByRegion);



            // $.when(deff[0], deff[1]).done(function(responseData, responseStats) {
            //     //add to existing chart
            //     /*if (cutBy == "sovereignt") {
            //         var cells = responseData[0].cells;
            //     } else {
            //         var cells = responseStats[0].cells;
            //     }*/

            //     var cells = responseData[0].cells;
            //     //debugger;
            //     //debugger;

            //     var dataByYear = {};
            //     var series = {};
            //     var seriesArray = [];
            //     //
            //     //by country
            //     _.forEach(cells, function(c) {
            //         dataByYear[c["geometry__time"].toString()] = [];
            //         series[c["geometry__country_level0." + cutBy]] = []
            //     });

            //     _.forEach(cells, function(c) {
            //         //if ((c["geometry__time"] >= fromYear) && (c["geometry__time"] <= toYear)) {
            //         series[c["geometry__country_level0." + cutBy]].push([c["geometry__time"], c[indicators[0] + "__amount_sum"]]);
            //         dataByYear[c["geometry__time"]].push(c[indicators[0] + "__amount_sum"]);
            //         //}
            //     });


            //     var chart = $('#viz-container').highcharts();

            //     for (var countryName in series) {

            //         chart.addSeries({
            //             name: countryName,
            //             data: series[countryName],
            //             visible: true
            //         }, false /*redraw*/ );



            //     }

            //     chart.redraw();




            // });

        }
    }

    ko.applyBindings(model);


    var initialize = function() {

        //track hash update
        window.onhashchange = function(evt) {
            var newURL = evt.newURL;
            var _hashParams = window.utils.getHashParams();
            yearsFilter = _hashParams.f.split("|");
            if (chartType == "line") {
                setExtremes(yearsFilter[0], yearsFilter[1]);
            } else {
                updateChartData(yearsFilter);
            }

        }


    }

    var createYearSlider = function(minYear, maxYear) {

        //var minYear = parseInt(yearsRange[0]);
        //var maxYear = parseInt(yearsRange[1]);

        var minYearFilter = parseInt(yearsFilter[0]);
        var maxYearFilter = parseInt(yearsFilter[1]);

        var isRange = false;

        if (chartType == "line" || chartType == "scatter") {
            isRange = true;
        }

        var sliderOptions = {
            range: isRange,
            min: minYear,
            max: maxYear,

            change: function(event, ui) {

                var isRange = ui.values;
                //var series = $('#viz-container').highcharts().series

                var startYear = isRange ? ui.values[0] : ui.value;

                var endYear = isRange ? ui.values[1] : ui.value;

                var yearLabel = startYear;

                if (startYear != endYear) {
                    yearLabel = startYear + "-" + endYear;
                    // model.selectYear([startYear, endYear]);
                } else {
                    // model.selectYear([startYear]);
                }

                //update hash
                var currentHash = window.utils.getHashParams();
                currentHash.f = startYear + "|" + endYear;

                window.utils.updateHash(currentHash);
                //redrawChart(startYear, endYear);
            },
            slide: function(event, ui) {
                //  debugger;

                // $("#filter-years-label")[0].innerHTML = ui.values[0] + " - " + ui.values[1];

            }
        }

        if (chartType == "line" || chartType == "scatter") {
            sliderOptions.values = [minYearFilter, maxYearFilter];
            sliderOptions.min = minYear;
            sliderOptions.max = maxYear;
        } else {
            sliderOptions.value = maxYearFilter;
        }


        $("#filter-years").slider(sliderOptions).slider("pips", {
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
            cell.id = i
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

        // Reformat columns array for wide data grid
        columns = [{
            "id": "indicator",
            "name": "indicator",
            "field": "indicator",
            "sortable": "true"
        }, {
            "id": "country",
            "name": "country",
            "field": "country",
            "sortable": "true"
        }];


        //Get years and append to columns
        data.forEach(function(entry) {

            var yearExists = 0;
            columns.forEach(function(column) {
                if (entry['year'] == column['name'])
                    yearExists = 1;
            });

            if (!yearExists)
                columns.push({
                    "id": entry['year'],
                    "name": entry['year'],
                    "field": entry['year'],
                    "sortable": "true"
                });
        });

        // Columns array needs an ID for slickgrid
        columns.push({
            "id": "id",
            "name": "id",
            "field": "id",
            "sortable": "true"
        });

        // Create the array in a wide format
        var dataWide = new Array;

        function createDataWide(id, indicator, country, i) {
            var dataTempObj = {};
            dataTempObj['indicator'] = indicator;
            dataTempObj['country'] = country;
            data.forEach(function(entry) {
                if (dataTempObj['indicator'] == Object.keys(entry)[i] && dataTempObj['country'] == entry['region']) {
                    dataTempObj[entry['year']] = entry[indicator];
                }
            });
            dataTempObj['id'] = id;
            dataWide.push(dataTempObj);
        }

        data.forEach(function(entry) {
			
			var numIndicators = Object.keys(entry).length - 3;
			
			for (i=0; i < numIndicators; i ++){
				var indicator = Object.keys(entry)[i];
				
				if (dataWide.length == 0) {
					createDataWide(0, indicator, entry['region'], i);
				} else {
					var indicatorCountryExists = 0;
					var id = 0;
					dataWide.forEach(function(dataEntry, i) {
						if (dataEntry['indicator'] == indicator && dataEntry['country'] == entry['region']) {
							indicatorCountryExists = 1;
						}
						id = i + 1;
					});
					if (!indicatorCountryExists) {
						createDataWide(id, indicator, entry['region'], i);
					}
				}
			}
        });
        
        var options = {
            enableCellNavigation: true,
            enableColumnReorder: true,
            forceFitColumns: false,
            defaultColumnWidth: 150,
            rowHeight: 35
        }
		
        var dataView = new Slick.Data.DataView();

        // Pass it as a data provider to SlickGrid.
        var grid = new Slick.Grid("#data-table", dataView, columns, options);
        
        // Make the grid respond to DataView change events.
        dataView.onRowCountChanged.subscribe(function (e, args) {
          grid.updateRowCount();
          grid.render();
        });

        dataView.onRowsChanged.subscribe(function (e, args) {
          grid.invalidateRows(args.rows);
          grid.render();
        });
        
        dataView.setItems(dataWide);
        
        grid.onSort.subscribe(function(e, args) {
            var comparer = function(a, b) {
                return (a[args.sortCol.field] > b[args.sortCol.field]) ? 1 : -1;
            }

            dataView.sort(comparer, args.sortAsc);
        });
        
        /*$("#data-table").slickgrid({
            columns: columns,
            data: dataWide,
            slickGridOptions: {
                //enableCellNavigation: true,
                //enableColumnReorder: true,
                forceFitColumns: false,
                autoExpandColumns: true,
                //resizeable: true,
                //width: 100,
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
        });*/

    }

    var geoJSONHandler = function(response, type) {

        function onEachFeature(feature, layer) {

            if (feature.properties) {
                // console.log(feature.properties);
                var name = feature.properties.sovereignt || feature.properties.usaid_reg || feature.properties.continent || feature.properties.dod_cmd || feature.properties.dos_region || feature.properties.wb_inc_lvl;
                layer.bindPopup(name);
            }
        }

        lastGeoJson = response;

        //if (!window.visualization.geoJsonLayers[type]) {
        //if layer doesnt exist then add it and symbolize as invisible 
        geoJson[type] = response;

        geoJsonLayers[type] = L.geoJson(response, {
            style: {

                weight: 0, //no border
                opacity: 1,
                color: 'gray',
                //dashArray: '3',
                fillOpacity: 1.0, //DO NOT DISLAY
                fillColor: '#f7a2a2'
            },
            onEachFeature: onEachFeature
        });

        for (var _type in geoJsonLayers) {
            if (type == _type) {
                map.addLayer(geoJsonLayers[_type]);
            }
        }

        /*} else {
            //if layer exists bring it on top

        }*/

    }

    var changeGroup = function(groupId) {
        debugger;
        if (groupId == "all") {
            groupId = "sovereignt";
        }

        if (!geoJsonLayers[groupId]) {
            window.loader.loadGeoJSON(groupId, geoJSONHandler);
            debugger;
        } else {
            //debugger;
            //move this layer on top
            //TODO: Leroy
        }

    }

    var indicatorDataLoadHandler = function(args) {


        var responseDeferred = args;

        indicatorsMeta = _.remove(responseDeferred, function(r) {
            return !r[0].cells;
        });

        var statsData = _.remove(responseDeferred, function(r) {
            return r[0].attributes.length == 1 && r[0].attributes[0] == "geometry__time";
        });


        var indicatorsData = responseDeferred;

        _.forEach(indicatorsData, function(response) {

            var data = response[0];
            var levels = data.levels;
            var cutBy = "name";
            //debugger;
            for (var levelId in levels) {
                if (levelId != "geometry__time") {

                    if (levelId == "geometry__country_level0") {
                        cutBy = "name";
                    } else {
                        var len = "geometry__country_level0@".length;
                        cutBy = levelId.substring(len, levelId.length);
                    }
                }
            }

            data.cutBy = cutBy;
            // debugger;
        });
        //debugger;
        //normalize the data now

        var mergedCells = [];

        _.forEach(indicatorsData, function(response) {

            var data = response[0];
            var cutBy = data.cutBy;

            _.forEach(data.cells, function(cell) {

                cell.region = cell["geometry__country_level0." + cutBy];
                cell.year = cell.geometry__time;

                delete cell.geometry__time;
                delete cell["geometry__country_level0." + cutBy];
                delete cell.num_entries;

                for (var id in cell) {
                    if (id.indexOf("__amount_max") > -1) {
                        delete cell[id];
                    }

                    if (id.indexOf("__amount_min") > -1) {
                        delete cell[id];
                    }

                    if (id.indexOf("__amount_sum") > -1) {
                        delete cell[id];
                    }
                }

            });

            mergedCells = mergedCells.concat(data.cells);

        });


        //var responseData = args[0];
        var responseData = {
            cells: mergedCells
        }

        var responseStats = statsData[0];

        // var indicatorsMeta = [].splice.call(args, 0);
        // indicatorsMeta.shift(); //remove first two
        // indicatorsMeta.shift();

        //debugger;

        if(chartType=="map")
            {
                $("#loading").hide();
            map = L.map('viz-container').setView([0, 0], 3);

            L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>',
                    maxZoom: 18,
                    noWrap: true
                }).addTo(map);
            //window.utils.createMapViz();
            //changeGroup("all");
            }else{
				if (chartType == "scatter"){
					yearsExtremesForData = window.utils.getHashParams().f.split("|");
				}
				
				var sortedData = window.utils.prepareHighchartsJson(responseData, responseStats[0], indicatorsMeta, chartType, indicators, yearsExtremesForData);

				var highChartsJson = sortedData.highcharts;
				//regionalAverageData = sortedData.average;

				//highChartsJson.title.text = "";
				//highChartsJson.chart.type = chart;
				// highChartsJson.yAxis.title.text = "";
				//debugger;
				highChartsJson.chart.events = {
					load: function() {
						//debugger;
						var allowedSetExtremeCharts = ["line", "bar"];
						var xAxis = this.series[0].xAxis;
						if (chartType == "bar") {
							yearsFilter[0] = yearsFilter[1];
						}




						$("#loading").hide();

						if (_.indexOf(allowedSetExtremeCharts, chartType) > -1) {
							xAxis.setExtremes(yearsFilter[0], yearsFilter[1]);
						}




					}
				}
				//debugger;
				//highChartsJson.subtitle.text = type;
				var chart = $('#viz-container').highcharts(highChartsJson);





				showTable(responseData);
			}
		}
    var useNarrowExtremes = true;



    var setExtremes = function(startYear, endYear) {
        //$("#loading").show();

        var chart = $('#viz-container').highcharts();
        var xAxis = chart.series[0].xAxis;

        xAxis.setExtremes(startYear, endYear);


    }

    var updateChartData = function(year) {

        var activeChart = $('#viz-container').highcharts();
        //first three series are the stats
		//debugger;
        var json = window.utils.prepareHighchartsJson({
            cells: window.utils.masterCells
        }, {
            cells: []
        }, indicatorsMeta, chartType, indicators, year);

		if (chartType == "scatter") {
            var series = json.highcharts.series;
			
			//debugger;
            _.forEach(series, function(s, i) {
                var data = s.data;
				if (i > 2)
					activeChart.series[i].setData(data, true);
            });
        }

        if (chartType == "bubble") {
            var seriesArray = json.highcharts.series;
            _.forEach(seriesArray, function(s, i) {
                var data = s.data;
                if (i > 2) {
                    activeChart.series[i].setData(data, true);
                }
            });
        }

        if (chartType == "bar") {

            var series = json.highcharts.series[0];
            var dataMapping = {};
            _.forEach(series.data, function(d, i) {
                var data = d;
                if (!dataMapping[d[0]]) {
                    dataMapping[d[0]] = d[1];
                }
            });

            var currentData = _.map(activeChart.series[0].data, function(d) {
                return [d.name, d.y];
            });

            //update current data with new data
            //debugger;
            _.forEach(currentData, function(d, i) {
                var data = d;
                if (i > 2) {
                    d[1] = dataMapping[d[0]];
                }
            });
            //debugger;
            activeChart.series[0].setData(currentData, true);

        }



    };


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

        //get year extremes for the indicators selected

        _.forEach(indicators, function(indicatorId) {
            var years = response.data.indicators.data[indicatorId].years;
            var yearStart = years[0];
            var yearEnd = years[years.length - 1];

            if (yearsExtremesForData.length == 0) {

                yearsExtremesForData.push(yearStart);
                yearsExtremesForData.push(yearEnd);

            } else {

                if (yearStart < yearsExtremesForData[0]) {
                    yearsExtremesForData[0] = yearStart;
                }

                if (yearEnd > yearsExtremesForData[1]) {
                    yearsExtremesForData[1] = yearEnd;
                }
            }

        });

        //debugger;
        //create slider first
        createYearSlider(yearsExtremes[0], yearsExtremes[1]);

        window.utils.bindIndicators(response, model);

        //now get the data
        if (indicators.length > 1) {
            //switch to group by indicators
            groupBy = "indicators";
        }
        var deferredMetaList = window.loader.loadIndicatorsMeta(indicators);
        var deferredList = window.loader.loadIndicatorData(indicators, regions, yearsExtremes);
        deferredList = deferredList.concat(deferredMetaList);

        //$.when(deferredList[0], deferredList[1]).done(indicatorDataLoadHandler);

        $.when.apply($, deferredList).done(function(response) {
            indicatorDataLoadHandler(arguments, yearsExtremes);
        });

        eventBind();

    }

    window.loader.loadIndicatorList(window.config.server + window.config.services.categories, indicatorListLoadHandler);


    var countriesListLoadHandler = function(response) {

        window.utils.bindCountries(response, model);

    }

    window.loader.loadCountries("", countriesListLoadHandler);

    initialize();

}())