(function() {

    /**
     * Start the Wiard mode
     **/

    $(function() {
        // $('#vizTabs a:first').tab('show')
    });


    var eventBind = function() {

        $(".list-group-item").popover({
            trigger: "hover"
        });

        //var val = $('#filter-years').slider("option", "value");


        // $('.dropdown-toggle').dropdown();

        $(".flip").click(function() {

            if (expandedCategory) {
                expandedCategory = false;
                return;
            }

            $(".flip").css("z-index", 10);
            $(this).css("z-index", 1000);
            $(".flip").find("div.list-group").removeClass("shadow");

            $(this).find("div.list-group").addClass("shadow");

            var isFlipped = $(this).find(".card").hasClass("flipped");

            $(".flip").find(".card").removeClass("flipped");
            $(".flip").removeClass("flippedCol");
            //- $(".list-group").css("display": "none");

            if (isFlipped) {
                //$(this).find(".card").removeClass("flipped");
                // $(this).find(".list-group").removeClass("show-me");

            } else {
                $(this).find(".card").addClass("flipped");
                $(this).addClass("flippedCol");

                //$(this).find(".list-group").addClass("show-me");
            }
            return true;
        });
    }


    var expandedCategory = false;


    //KNOCKOUT MODEL
    var model = {

        selectYear: function(years) {
            var yearsArray = [];

            if (!(years instanceof Array)) {
                yearsArray = [years];
            } else {
                yearsArray = years;
            }
            model.activeYears.removeAll();

            model.activeYears(yearsArray);

        },

        selectIndicator: function() {
            if (expandedCategory) {
                return;
            }
            var indicatorIds = [];
            var indicatorLabel = arguments[0].label;
            indicatorIds.push(arguments[0].id);
            model.activeIndicator(indicatorLabel);
            model.activeIndicatorId(arguments[0].id);
            var current = model.selectionTracker();
            current.indicator = true;
            current.vizualization = false;
            model.selectionTracker(current);
            //move to second
            $('#vizTabs a[href="#select-vizualization"]').tab('show')

            var activeGroup = model.activeGroup();
            var activeRegion = model.activeRegion();

            window.loadIndicatorData(indicatorIds, activeGroup.id, activeRegion, indicatorDataLoadHandler);

        },

        selectIndicatorMultiple: function() {
            // if (expandedCategory) {
            //     return;
            // }
            var selectedIndicator = arguments[0];

            model.activeIndicators.removeAll();
            model.indicatorsModel.removeAll();
            _.forEach(model.indicatorsModelMaster(), function(indicator) {
                if (selectedIndicator.id == indicator.id) {
                    indicator.selected = !indicator.selected;
                }
                if (indicator.selected) {
                    model.activeIndicators.push(indicator.id)
                }
                model.indicatorsModel.push(indicator);
            });
            // debugger;
            // return;
            // var indicatorId = arguments[0].id;
            // //indicatorIds.push(arguments[0].id);
            // model.activeIndicator(indicatorLabel);
            // model.activeIndicatorId(arguments[0].id);
            // var current = model.selectionTracker();
            // current.indicator = true;
            // current.vizualization = false;
            // model.selectionTracker(current);
            // //move to second
            // $('#vizTabs a[href="#select-vizualization"]').tab('show')

            // var activeGroup = model.activeGroup();
            // var activeRegion = model.activeRegion();
            //window.loadIndicatorData(indicatorIds, activeGroup.id, activeRegion, indicatorDataLoadHandler);

        },

        selectVizualization: function(type) {

            var vizualizationType = type;
            model.activeChart(vizualizationType);
            var current = model.selectionTracker();
            current.indicator = true;
            current.vizualization = true;
            model.selectionTracker(current);
            //move to third tab

            $('#vizTabs a[href="#vizualize"]').tab('show');

            var highChartsJson = model.activeData();
            highChartsJson.title.text = model.activeIndicator();
            highChartsJson.chart.type = type;
            highChartsJson.yAxis.title.text = "";
            //highChartsJson.subtitle.text = type;
            $('#viz-container').highcharts(model.activeData());


        },

        selectCountry: function() {
            var countryLabel = arguments[0].label;
            var countryId = arguments[0].code;

            var countriesModel = _.clone(model.countriesModel(), true);
            model.countriesModel.removeAll();
            _.forEach(countriesModel, function(country) {
                if (countryLabel == country.label) {
                    country.selected = !country.selected;
                }
                model.countriesModel.push(country);
            })
            // model.countriesModel(response.data);
            // model.countriesModelMaster(_.clone(response.data, true));

            model.activeCountries.push(arguments[0]);

            var current = model.selectionTracker();
            current.filter = true;
            model.selectionTracker(current);

            // $('#vizTabs a[href="#select-indicator"]').tab('show');
        },

        selectCountryGroup: function() {

            var groupId = arguments[0].id;
            model.activeGroup(arguments[0]);

            if (groupId == "all") {
                model.selectCountryGroupRegion("all"); //just select all countries
            }
            //assign region to countryGroupRegion
            model.countryGroupRegions.removeAll();
            _.forEach(model.countryGroupings(), function(countryGroup) {
                if (groupId == countryGroup.id) {
                    model.countryGroupRegions(countryGroup.regions);
                }
            })


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

        expandCategory: function(model, evt) {

            expandedCategory = true;


        },

        clearFilter: function() {

            var current = model.selectionTracker();
            current.filter = false;
            model.selectionTracker(current);

        },

        clearIndicator: function() {

            var current = model.selectionTracker();
            current.indicator = false;
            model.selectionTracker(current);

        },

        clearChart: function() {

            var current = model.selectionTracker();
            current.vizualization = false;
            model.selectionTracker(current);

        },


        selectionTracker: ko.observable({

            filter: false,
            indicator: false,
            vizualization: false

        }),

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

        activeGroup: ko.observable({
            "id": "all",
            "label": "All",
            "regions": []
        }),

        activeRegion: ko.observable(""),

        activeYears: ko.observableArray([2000, 2013]),

        activeCountries: ko.observableArray([]),

        activeIndicator: ko.observable(""),

        activeIndicators: ko.observableArray([]),

        activeIndicatorId: ko.observable(""),

        activeChart: ko.observable(""), //pie, bar

        activeData: ko.observable({}), //data itself

        countriesModel: ko.observableArray([]),

        countriesModelMaster: ko.observableArray([]),

        categoriesModel: ko.observableArray([]),

        sourcesModel: ko.observableArray([]),

        indicatorsModel: ko.observableArray([]),

        indicatorsModelMaster: ko.observableArray([]),

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

        newSearch: ko.observable(true)


    }


    var countriesListLoadHandler = function(response) {

        var countryGroupings = _.clone(model.countryGroupings(), true);


        _.forEach(countryGroupings, function(countryGroup, i) {

            var groupId = countryGroup.id;

            if (countryGroup.id != "all") {

                _.forEach(response.data, function(country) {

                    //find level this country belongs to in this group
                    var region = country.regions[groupId];
                    if (_.indexOf(countryGroup.regions, region) < 0) {
                        countryGroup.regions.push(region);
                    }

                });
            }


        });

        model.countryGroupings.removeAll();

        _.forEach(countryGroupings, function(countryGroup, i) {
            model.countryGroupings.push(countryGroup);
        })






        _.forEach(response.data, function(country) {
            country.selected = true;
        });


        model.countriesModel(response.data);
        model.countriesModelMaster(_.clone(response.data, true));

    }



    var indicatorListLoadHandler = function(response) {

        var categoriesAll = response.data.categories;
        var sourcesAll = response.data.sources;
        var indicatorsAll = response.data.indicators;

        var categoriesModel = [];
        var sourcesModel = [];
        var indicatorsModel = [];

        //Sort out Categories
        for (var cat in categoriesAll.data) {

            var indicatorsInCategory = _.map(categoriesAll.data[cat].indicators, function(indicatorId) {

                var sourceId = _.get(indicatorsAll, 'data[indicatorId].source');
                var sourceLabel = _.get(sourcesAll, 'data[sourceId].label');

                var cloneIndicator = _.clone(indicatorsAll.data[indicatorId], true);

                cloneIndicator.source = sourceLabel;
                cloneIndicator.id = indicatorId;
                return cloneIndicator;
            });
            //debugger;
            var newCategory = {
                "label": categoriesAll.data[cat].label,
                "length": categoriesAll.data[cat].indicators.length,
                "indicators": indicatorsInCategory,
                "subcategories": []
            }

            categoriesModel.push(newCategory);

        }
        //debugger;
        //Sort out Sources
        for (var src in sourcesAll.data) {

            var indicatorsInSource = _.map(sourcesAll.data[src].indicators, function(indicatorId) {

                var categoryId = _.get(sourcesAll, 'data[indicatorId].category');
                var categoryLabel = _.get(sourcesAll, 'data[categoryId].label');

                var cloneIndicator = _.clone(indicatorsAll.data[indicatorId], true);

                cloneIndicator.source = categoryLabel;
                return cloneIndicator;

            });

            var newSource = {
                "label": sourcesAll.data[src].label,
                "length": sourcesAll.data[src].indicators.length,
                "indicators": indicatorsInSource
            }

            sourcesModel.push(newSource);

        }
        //debugger;
        //Get the actual categories and sources
        for (var ind in indicatorsAll.data) {

            var newIndicator = indicatorsAll.data[ind];
            var sourceId = newIndicator.source;
            var categoryId = newIndicator.category;


            newIndicator.source = _.get(sourcesAll, 'data[sourceId].label');
            newIndicator.category = _.get(categoriesAll, 'data[categoryId].label');
            newIndicator.id = ind;
            newIndicator.selected = false;
            //newIndicator.popup = newIndicator.source + "<br>" + newIndicator.category;
            indicatorsModel.push(newIndicator);



        }
        // debugger;

        model.categoriesModel(categoriesModel);
        model.sourcesModel(sourcesModel);
        model.indicatorsModel(indicatorsModel);
        model.indicatorsModelMaster(_.clone(indicatorsModel, true));

        $("#filter-years").slider({
            range: true,
            min: 1990,
            max: 2013,
            values: [2000, 2013],
            slide: function(event, ui) {
                var startYear = ui.values[0];
                var endYear = ui.values[1];
                var yearLabel = startYear;

                if (startYear != endYear) {
                    yearLabel = startYear + "-" + endYear;
                    model.selectYear([startYear, endYear]);
                } else {
                    model.selectYear([startYear]);
                }
                // $("#filter-years-label")[0].innerHTML = ui.values[0] + " - " + ui.values[1];

            }
        }).slider("pips", {
            /* options go here as an object */
        }).slider("float", {
            /* options go here as an object */
        });
        //enable knockout
        ko.applyBindings(model);

        eventBind();

    }

    window.loadIndicatorList(window.config.server + window.config.services.categories, indicatorListLoadHandler);
    window.loadCountries("", countriesListLoadHandler);

    // Under Five mortality rate

    // GDP, per capita

    // Poverty headcount ratio at $1.25 a day (PPP)

    // Literacy rate

    // Control of corruption

    var indicatorDataLoadHandler = function(response) {

        //prepare region search 
        // var availableRegions = [
        //     "Algeria",
        //     "Albania",
        //     "Angola",
        //     "China",
        //     "Colombia",
        //     "Croatia"
        // ];

        // $("#regions").autocomplete({
        //     source: availableRegions
        // });


        //multiselect
        var $callback = $("#callback");

        $("select").multiselect({
            click: function(event, ui) {
                $callback.text(ui.value + ' ' + (ui.checked ? 'checked' : 'unchecked'));
            },
            beforeopen: function() {
                $callback.text("Select about to be opened...");
            },
            open: function() {
                $callback.text("Select opened!");
            },
            beforeclose: function() {
                $callback.text("Select about to be closed...");
            },
            close: function() {
                $callback.text("Select closed!");
            },
            checkAll: function() {
                $callback.text("Check all clicked!");
            },
            uncheckAll: function() {
                $callback.text("Uncheck all clicked!");
            },
            optgrouptoggle: function(event, ui) {
                var values = $.map(ui.inputs, function(checkbox) {
                    return checkbox.value;
                }).join(", ");

                $callback.html("<strong>Checkboxes " + (ui.checked ? "checked" : "unchecked") + ":</strong> " + values);
            }
        });

        //prepare years

        $("#slider-years").slider({
            range: true,
            min: 1990,
            max: 2013,
            values: [1994, 2013],
            slide: function(event, ui) {

                var startYear = ui.values[0];
                var endYear = ui.values[1];
                var yearLabel = startYear;

                if (startYear != endYear) {
                    yearLabel = startYear + "-" + endYear;
                    model.selectYear([startYear, endYear]);
                } else {
                    model.selectYear([startYear]);
                }

                //$("#years-label").val(yearLabel);

            }
        });

        $("#years-label").val($("#slider-years").slider("values", 0) +
            " - " + $("#slider-years").slider("values", 1));


        var highChartsJson = window.prepareHighchartsJson(response, model.activeIndicator(), model.activeChart(), model.activeIndicatorId());

        model.activeData(highChartsJson);

        // $('#viz-container').highcharts(highChartsJson, model.activeIndicator(), model.activeChart());

    }


}())