var indicatorsArray=[];
selectedIndicatorMultipleCount=0;
function changeBubbleSquare(){
    $("#bubbleIconSquare").after(
                                "<div id='showAxes' style='width:40%;padding:0'>"+
                                // "<div class='row' style='width: 30%; padding:0'>\n"+
                                    // "<div class='col-md-2'>\n"+
                                    "<div>\n"+
                                        "<small>\n"+
                                            "<b class='pull-left'>X-axis:</b>\n"+
                                            // "<br>\n"+
                                            "<span id='bubble1'></span>\n"+
                                        "</small>\n"+
                                    "</div>\n"+
                                    "<div>\n"+
                                        "<small>\n"+
                                            "<b class='pull-left'>Y-axis:</b>\n"+
                                            // "<br>\n"+
                                            "<span id='bubble0'></span>\n"+
                                        "</small>\n"+
                                    "</div>\n"+
                                    "<div>\n"+
                                        "<small>\n"+
                                            "<b class='pull-left'>Bubble size:</b>\n"+
                                            // "<br>\n"+
                                            "<span id='bubble2'></span>\n"+
                                        "</small>\n"+
                                    "</div>\n"
                                    +
                                "</div>"
                                );
    $("#bubbleIconSquare").css({'width':'35%','padding':0, 'float':'right'});
    // $("#bubbleIconSquare").css();
    // $("#bubbleIconSquare").css('class', 'pull-right');
    $("#bubbleSquare").css({'float':'right'});
    $("#bubble1").text(indicatorsArray[1]);
    $("#bubble0").text(indicatorsArray[0]);
    $("#bubble2").text(indicatorsArray[2]);
    // console.log("changeBubbleSquare executed");
}

function unchangeBubbleSquare(){
    $("#showAxes").remove();
    $("#bubbleIconSquare").css({'width':'100%','float':'none'});
    $("#bubbleSquare").css({'float':'none'});
}

(function() {

    window.vizModel = {

        // getIndicatorsArray: function(x){
        //     console.log("x is: " + x);
        //     console.log("getIndicatorsArray test");
        //     console.log("indicatorsArray[x] is: "+indicatorsArray[x]);
        //     return indicatorsArray[x];
        // },

        selectView: function(type) {

            switch (type) {
                case "countries":
                    setTimeout(function() {
                        window.visualization.createMap();
                    }, 10);

                    break;
            }
        },

        downloadData: function(format, indicator, evt) {


            evt.stopPropagation();

            window.clickedIndicator = true;

            var groupId = vizModel.activeGroup().id;
            if (groupId != "all") {
                var urlTemplate = "/api/3/slicer/aggregate?cubes={indicator_id}&drilldown=geometry__country_level0@{groupId}|geometry__time@time&cut=geometry__country_level0@{groupId}:{region}&format={format}&daterange={yearFrom}-{yearTo}&order=time"
            } else {
                var urlTemplate = "/api/3/slicer/aggregate?cubes={indicator_id}&drilldown=geometry__time|geometry__country_level0@sovereignt&format={format}&daterange={yearFrom}-{yearTo}&order=time"
            }
            //var urlTemplate = "/api/slicer/cube/geometry/cubes_aggregate?cubes={indicator_id}&drilldown=geometry__country_level0@{groupId}|geometry__time@time&cut=geometry__country_level0@{groupId}:{region}&format={format}"
            var url = urlTemplate.replace(/{indicator_id}/g, indicator.id);
            url = url.replace(/{format}/g, format);
            url = url.replace(/{groupId}/g, groupId);
            url = url.replace(/{region}/g, vizModel.activeRegion());
            url = url.replace(/{yearFrom}/g, vizModel.activeYears()[0]);
            url = url.replace(/{yearTo}/g, vizModel.activeYears()[1] || vizModel.activeYears()[0]);
            window.open(url, '_blank');


        },

        selectYear: function(years) {
            var yearsArray = [];
            var pickedFromDropdown = false;
            if (!(years instanceof Array)) {
                yearsArray = [years];
                pickedFromDropdown = true;
            } else {
                yearsArray = years;
            }
            vizModel.activeYears.removeAll();

            vizModel.activeYears(yearsArray);

            if (pickedFromDropdown) {
                $("#filter-years").slider('values', 0, years);
                $("#filter-years").slider('values', 1, years);

            }

        },


        removeIndicator: function(selectedIndicator) {

            var indicatorIndex = _.indexOf(vizModel.activeIndicators(), selectedIndicator);
            vizModel.activeIndicators.splice(indicatorIndex, 1);


            $("[data-indicatorid='" + selectedIndicator.id + "']").parent().removeClass("selected");

            // TODO -- inprogress -- make sure flip sequence is working properly
            //window.utils.flipCardEvent();

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

        selectIndicatorMultiple: function(selectedIndicator, evt, goToVisualize) {

            // console.log("TESTING");
            // console.log("Selected Indicator is: " + selectedIndicator.label);
            // $.each(selectedIndicator, function(k,v){console.log(k+ " : "+ v)});
            if (goToVisualize) {
                //TODO: Calculate Year Extremes
                window.location.href = "data-visualization#f=1990|2014&i=" + selectedIndicator.id + "&c=line&r=dos_region:all";
                return;
            }

            window.clickedIndicator = true;

            var $this = $("[data-indicatorid='" + selectedIndicator.id + "']").parent();

            // toggle the selection/deselection
            if($this.hasClass("selected")) {
              $this.removeClass("selected");
              vizModel.removeIndicator(selectedIndicator);
            } else {
              $this.addClass("selected");
              vizModel.activeIndicators.push(selectedIndicator);
              // vizModel.indicatorsArray.push(selectedIndicator.label);
              indicatorsArray.push(selectedIndicator.label);
              // console.log("Indicators Array is: " + indicatorsArray);
              if (indicatorsArray.length==3){
                changeBubbleSquare();
                  // $("#bubble1").text(indicatorsArray[1]);
                  // $("#bubble0").text(indicatorsArray[0]);
                  // $("#bubble2").text(indicatorsArray[2]);
              }
              else{
                unchangeBubbleSquare();
              }
            }
            selectedIndicatorMultipleCount++;

            // console.log("activeIndicators is: " + vizModel.activeIndicators[0].label);
            // console.log("activeIndicators is: " + vizModel.activeIndicators[1].label);
            // console.log("activeIndicators is: " + vizModel.activeIndicators[2].label);
            // $.each(vizModel.activeIndicators, function(k,v){console.log(k+ " : "+ v)});

            // TODO -- inprogress -- make sure flip sequence is working properly
            //window.utils.flipCardEvent();

        },

        selectVizualization: function(type) {

            var groupByRegion = vizModel.groupByRegion();

            var allowMultivariate = ["scatter", "bubble", "radar", "tree"];

            var allowSinglevariate = ["line", "bar", "map"];

            var indicators = _.map(vizModel.activeIndicators(), function(indicator) {
                return indicator.id;
            });

            var indicatorLabels = _.map(vizModel.activeIndicators(), function(indicator) {
                return indicator.label;
            });

            var countries = _.map(vizModel.activeCountries(), function(country) {
                return country.geounit; //either country or region
            });

            //validate
            var isMultivariate = indicators.length > 1;

            if (isMultivariate && _.indexOf(allowMultivariate, type) > -1) {
                //proceed
            }

            if (isMultivariate && _.indexOf(allowMultivariate, type) < 0) {
                window.modalTitle = "Alert";
                window.modalMessage = "Multiple indicators are supported by Scatter, Radar, and Tree charts";
                $('#modal').modal('show');
                //alert("Multiple indicators are supported by Scatter, Radar, and Tree charts");
                return;
            }

            if (!isMultivariate && _.indexOf(allowSinglevariate, type) > -1) {
                //proceed
            }

            if (!isMultivariate && _.indexOf(allowSinglevariate, type) < 0) {
                window.modalTitle = "Alert";
                window.modalMessage = "Single indicators are supported by Line and Bar charts";
                $('#modal').modal('show');
                //alert("Single indicators are supported by Line and Bar charts")
                return;
            }

            //debugger;

            //TODO: Calculate Year Extremes, change activeYears to extremes
            var hashString = //"y=1990|2014" + // + vizModel.activeYears().join("|")
                "f=" + vizModel.activeYears().join("|") +
                "&i=" + indicators.join("|") +
                //"&l=" + indicatorLabels.join("|") +
                "&c=" + type +
                //"&g=" + vizModel.activeGroup().id +
                //"&r=" + vizModel.activeRegion() +
                "&r=" + countries.join("|");

            /*if (groupByRegion) {
                hashString += "&grp=1";
            } else {
                hashString += "&grp=0";
            }*/

            window.location.href = "/data-visualization#" + hashString;

        },

        selectCountry: function(selectedCountry, evt, goToVisualize, breakdown) {

            var isGroup = selectedCountry.geounit.indexOf(":all") == selectedCountry.geounit.length - 4;

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

            var abbr = selectedCountry.id.toLowerCase();
            var $this = $("."+abbr+"").parent();

            // toggle the selection/deselection
            if ($this.hasClass("selected")) {
              $this.removeClass("selected");
              //vizModel.removeCountry(selectedCountry);
              var activeCountries = vizModel.activeCountries();
              var selectedIndex = _.indexOf(activeCountries, selectedCountry);

              vizModel.activeCountries.splice(selectedIndex, 1);

              // make sure selectetion is false
              selectedCountry.selected = false;

              // allows for immediate ui response before map load
              setTimeout(function(){
                window.utils.highlightOnMap(vizModel, selectedCountry);
              },25);


            } else {
              $this.addClass("selected");
              selectedCountry.selected = true;

              vizModel.activeCountries.push(selectedCountry);

              // allows for immediate ui response
              setTimeout(function(){
                window.utils.highlightOnMap(vizModel, selectedCountry)
              },25);
            }

        },

        clearActiveCountries: function() {

            var model =  vizModel.activeCountries();
            for(var i = 0; i  < model.length; i++) {

                var abbr = model[i].id.toLowerCase();
                var $this = $("."+abbr+"").parent();
                $this.removeClass("selected");

            }
            vizModel.activeCountries.removeAll();
            window.visualization.changeGroup("all");
        },

        clearActiveIndicators: function() {
            // remove from list
            indicatorsArray=[];
            vizModel.activeIndicators.removeAll();
            // removed selected class
            $( ".indicator-item").removeClass("selected");
        },

        selectCountryGroup: function() {

            var groupId = arguments[0].id;

            window.visualization.changeGroup(groupId);

            vizModel.activeGroup(arguments[0]);
            vizModel.activeRegion(""); //set active region to undefined
            //vizModel.countryGroupRegions.removeAll();

            if (groupId == "all") {
                vizModel.selectCountryGroupRegion("all"); //just select all countries
            } else {
                //assign region to countryGroupRegion


                _.forEach(vizModel.countryGroupings(), function(countryGroup) {
                    if (groupId == countryGroup.id) {
                        //vizModel.countryGroupRegions(_.clone(countryGroup.regions, true));
                        vizModel.selectCountryGroupRegion(_.values(countryGroup.regions)[0]);
                    }
                });

            }

        },

        selectCountryGroupRegion: function() {

            //debugger;
            var selectedRegion = arguments[0];
            var selectedGroup = vizModel.activeGroup();

            vizModel.activeRegion(selectedRegion);
            vizModel.countriesModel.removeAll();

            var countriesModelMaster = _.clone(vizModel.countriesModelMaster(), true);

            _.forEach(countriesModelMaster, function(country) {
                if (selectedRegion.id == "all") {
                    vizModel.countriesModel.push(country);
                } else if (_.has(country.regions, selectedGroup.id) && country.regions[selectedGroup.id] == selectedRegion.id) {
                    vizModel.countriesModel.push(country);
                }

            })

            //debugger;
            //window.utils.highlightOnMap(vizModel, true);
            //filter country view by region

        },

        expandMap: function() {
            var expanded = $(".countries-list .countries-col").css("display") == "none";

            if (expanded) {

                $(".countries-list .countries-col").css("display", "block");
                $(".countries-list .map-col").css("width", "");
            } else {

                $(".countries-list .countries-col").css("display", "none");
                $(".countries-list .map-col").css("width", "100%");
            }

            map.invalidateSize();


        },

        expandCategory: function(model, evt) {

            window.expandedCategory = true;


        },

        clearFilter: function() {

            var current = vizModel.selectionTracker();
            current.filter = false;
            vizModel.selectionTracker(current);

        },

        clearIndicator: function() {

            var current = vizModel.selectionTracker();
            current.indicator = false;
            vizModel.selectionTracker(current);

        },

        clearChart: function() {

            var current = vizModel.selectionTracker();
            current.vizualization = false;
            vizModel.selectionTracker(current);

        },


        selectionTracker: ko.observable({

            filter: false,
            indicator: false,
            vizualization: false

        }),

        filterIndicators: function(m, evt) {

            var value = evt.currentTarget.value;

            var indicators = vizModel.indicatorsModelMaster();
            vizModel.indicatorsModel.removeAll();
            //model.newSearch(false);

            for (var x in indicators) {

                if (indicators[x].label.toLowerCase().indexOf(value.toLowerCase()) >= 0) {
                    vizModel.indicatorsModel.push(indicators[x]);
                }
            }

            return true;

        },

        filterCountries: function(m, evt) {

            var value = evt.currentTarget.value;

            var activeGroup = _.clone(vizModel.activeGroup(), true);




            _.forEach(activeGroup.regions, function(r) {
                var countries = r.countries;

                _.forEach(countries, function(c) {
                    if (c.label.toLowerCase().indexOf(value.toLowerCase()) >= 0) {
                        c.filtered = true;
                    } else {
                        c.filtered = false;
                    }
                })
            });


            //debugger;
            //            vizModel.activeGroup({});

            vizModel.activeGroup(activeGroup);

            //model.newSearch(false);



            return true;

        },

        groupChange: function() {

            debugger;

        },

        filterCountry: ko.observable(""),

        hasCountryFilter: ko.observable(false),


        activeCard: ko.observable(""),

        activeYears: ko.observableArray([1990, 2014]),

        activeIndicator: ko.observable(""),

        activeIndicators: ko.observableArray([]),

        activeIndicatorId: ko.observable(""),

        activeChart: ko.observable(""), //pie, bar

        activeData: ko.observable({}), //data itself

        categoriesModel: ko.observableArray([]),

        sourcesModel: ko.observableArray([]),

        indicatorsModel: ko.observableArray([]),

        indicatorsModelMaster: ko.observableArray([]),

        activeCountries: ko.observableArray([]),

        activeGroup: ko.observable({
            "id": "all",
            "label": "All Countries",
            "regions": []
        }),

        activeRegion: ko.observable(""),

        groupByRegion: ko.observable(false),

        countriesModel: ko.observableArray([]),

        countriesModelMaster: ko.observableArray([]),

        countryGroupings: ko.observableArray([]),

        //can't find where this is being used
        //countryGroupRegions: ko.observableArray([]),

        newSearch: ko.observable(true)


    }



    window.vizModel.filterCountry.subscribe(function(newValue) {
        vizModel.hasCountryFilter(newValue.length > 0);
    });

    window.vizModel.groupByRegion.subscribe(function(newValue) {

    });

}())
