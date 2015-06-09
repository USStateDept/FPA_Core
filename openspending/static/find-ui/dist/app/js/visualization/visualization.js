(function() {

    /**
     * Start the Wiard mode
     **/
    var clickedIndicator = false;
    var mapCreated = false;
    $(function() {
        // $('#vizTabs a:first').tab('show')
    });

    window.createMap = function() {

        if (!mapCreated) {
            mapCreated = true;
            var map = L.map('map').setView([38, -77], 3);
            L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
                attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>',
                maxZoom: 18,
                id: 'examples.map-i875mjb7',
                accessToken: 'pk.eyJ1Ijoid2lzZWd1eSIsImEiOiI5N2IxYWYxMzU2YmZhOTU3ZjM4ZDRjZDBlMzNkYzU0NSJ9._T6Dz2ZFA4p9VZMdT2SmjA'
            }).addTo(map);
        }

    }


    var eventBind = function() {

        $(".list-group-item").popover({
            trigger: "hover"
        });

        //var val = $('#filter-years').slider("option", "value");
        flipCardEvent();

        // $('.dropdown-toggle').dropdown();


    }

    window.flipCardEvent = function() {

        $(".flip").click(function() {



            if (expandedCategory) {
                expandedCategory = false;
                return;
            }

            if (clickedIndicator) {
                clickedIndicator = false;
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

    var model = window.vizModel;



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
                cloneIndicator.selected = false;
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
                cloneIndicator.id = indicatorId;
                cloneIndicator.selected = false;
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



        var highChartsJson = window.prepareHighchartsJson(response, model.activeChart(), model.activeIndicators(), model.activeGroup(), model.activeRegion());

        model.activeData(highChartsJson);

        var highChartsJson = model.activeData();
        highChartsJson.title.text = model.activeIndicator();
        highChartsJson.chart.type = model.activeChart();
        highChartsJson.yAxis.title.text = "";
        //highChartsJson.subtitle.text = type;
        $('#viz-container').highcharts(model.activeData());
        $("#loading").hide();


        // $('#viz-container').highcharts(highChartsJson, model.activeIndicator(), model.activeChart());

    }



    //startUI(); //this should be the last function in this function


}())