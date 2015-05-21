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
            //- $(".list-group").css("display": "none");

            if (isFlipped) {
                //$(this).find(".card").removeClass("flipped");
                // $(this).find(".list-group").removeClass("show-me");

            } else {
                $(this).find(".card").addClass("flipped");
                //$(this).find(".list-group").addClass("show-me");
            }
            return true;
        });
    }


    var expandedCategory = false;


    //KNOCKOUT MODEL
    var model = {

        selectIndicator: function() {
            if (expandedCategory) {
                return;
            }
            var indicatorLabel = arguments[0].label;
            var indicatorId = arguments[0].id;
            model.activeIndicator(indicatorLabel);
            model.activeIndicatorId(indicatorId);
            var current = model.selectionTracker();
            current.indicator = true;
            current.vizualization = false;
            model.selectionTracker(current);
            //move to second
            $('#vizTabs a[href="#select-vizualization"]').tab('show')

            window.loadIndicatorData(indicatorId, indicatorDataLoadHandler);

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

            debugger;
        },

        expandCategory: function(model, evt) {

            expandedCategory = true;


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

        // showView: function(code) {


        //     $('#btn-primary').removeClass('active');
        //     $('#by-category').removeClass('active');
        //     $('#by-source').removeClass('active');
        //     $('#all-indicators').removeClass('active');
        //     switch (code) {

        //         case "category":
        //             $('#btn-category').addClass('active');
        //             $('#by-category').addClass('active');
        //             break;

        //         case "sources":
        //             $('#btn-source').addClass('active');
        //             $('#by-source').addClass('active');
        //             break;

        //         case "alphabetic":
        //             $('#btn-alphabetic').addClass('active');
        //             $('#all-indicators').addClass('active');
        //             break;

        //     }



        // },

        selectionTracker: ko.observable({

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

        activeIndicator: ko.observable(""),

        activeIndicatorId: ko.observable(""),

        activeChart: ko.observable(""), //pie, bar

        activeData: ko.observable({}), //data itself

        countriesModel: ko.observableArray([]),

        countriesModelMaster: ko.observableArray([]),

        categoriesModel: ko.observableArray([]),

        sourcesModel: ko.observableArray([]),

        indicatorsModel: ko.observableArray([]),

        indicatorsModelMaster: ko.observableArray([]),

        newSearch: ko.observable(true)


    }


    var countriesListLoadHandler = function(response) {

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
            //newIndicator.popup = newIndicator.source + "<br>" + newIndicator.category;
            indicatorsModel.push(newIndicator);



        }
        // debugger;

        model.categoriesModel(categoriesModel);
        model.sourcesModel(sourcesModel);
        model.indicatorsModel(indicatorsModel);
        model.indicatorsModelMaster(_.clone(indicatorsModel, true));
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
            values: [1994, 2015],
            slide: function(event, ui) {
                $("#years-label").val(ui.values[0] + " - " + ui.values[1]);
            }
        });

        $("#years-label").val($("#slider-years").slider("values", 0) +
            " - " + $("#slider-years").slider("values", 1));


        var highChartsJson = window.prepareHighchartsJson(response, model.activeIndicator(), model.activeChart(), model.activeIndicatorId());

        model.activeData(highChartsJson);

        // $('#viz-container').highcharts(highChartsJson, model.activeIndicator(), model.activeChart());

    }


}())