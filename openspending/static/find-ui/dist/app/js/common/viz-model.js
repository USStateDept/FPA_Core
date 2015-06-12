(function() {


    window.vizModel = {


        selectView: function(type) {

            switch (type) {
                case "countries":
                    setTimeout(function() {
                        window.createMap();
                    }, 10);

                    break;
            }
        },

        downloadData: function(format, indicator) {

            clickedIndicator = true;

            var groupId = vizModel.activeGroup().id;
            if (groupId != "all") {
                var urlTemplate = "/api/slicer/cube/geometry/cubes_aggregate?cubes={indicator_id}&drilldown=geometry__country_level0@{groupId}|geometry__time@time&cut=geometry__country_level0@{groupId}:{region}&format={format}&cut=geometry__time:{yearFrom}-{yearTo}&order=time"
            } else {
                var urlTemplate = "/api/slicer/cube/geometry/cubes_aggregate?cubes={indicator_id}&drilldown=geometry__time|geometry__country_level0@sovereignt&format={format}&cut=geometry__time:{yearFrom}-{yearTo}&order=time"
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



        selectIndicatorMultiple: function(selectedIndicator, evt, direct) {
            // if (expandedCategory) {
            //     return;
            // }



            if (direct) {
                window.location.href = "data-visualization#y=1990|2014&f=1990|2014&i=" + selectedIndicator.id + "&l=" + selectedIndicator.label + "&c=line&g=all&r=&cn=";
            }

            clickedIndicator = true;

            var categoriesModel = _.clone(vizModel.categoriesModel(), true);
            var sourcesModel = _.clone(vizModel.sourcesModel(), true);

            vizModel.activeIndicators.removeAll();
            vizModel.indicatorsModel.removeAll();
            _.forEach(vizModel.indicatorsModelMaster(), function(indicator) {
                if (selectedIndicator.id == indicator.id) {
                    indicator.selected = !indicator.selected;
                }
                if (indicator.selected) {
                    vizModel.activeIndicators.push(indicator)
                }
                vizModel.indicatorsModel.push(indicator);
            });

            vizModel.categoriesModel.removeAll();
            _.forEach(categoriesModel, function(category) {
                _.forEach(category.indicators, function(indicator) {
                    if (selectedIndicator.id == indicator.id) {
                        indicator.selected = !indicator.selected;
                    }
                });
                vizModel.categoriesModel.push(category);
            });


            vizModel.sourcesModel.removeAll();
            _.forEach(sourcesModel, function(source) {
                _.forEach(source.indicators, function(indicator) {
                    if (selectedIndicator.id == indicator.id) {

                        indicator.selected = !indicator.selected;
                    }
                });
                vizModel.sourcesModel.push(source);
            });

            window.flipCardEvent();
            // debugger;
            // return;
            // var indicatorId = arguments[0].id;
            // //indicatorIds.push(arguments[0].id);
            //vizModel.activeIndicator(indicatorLabel);
            //vizModel.activeIndicatorId(arguments[0].id);
            // var current =vizModel.selectionTracker();
            // current.indicator = true;
            // current.vizualization = false;
            //vizModel.selectionTracker(current);
            // //move to second
            // $('#vizTabs a[href="#select-vizualization"]').tab('show')

            // var activeGroup =vizModel.activeGroup();
            // var activeRegion =vizModel.activeRegion();
            //window.loadIndicatorData(indicatorIds, activeGroup.id, activeRegion, indicatorDataLoadHandler);

        },

        selectVizualization: function(type) {

            var indicators = _.map(vizModel.activeIndicators(), function(indicator) {
                return indicator.id;
            });

            var indicatorLabels = _.map(vizModel.activeIndicators(), function(indicator) {
                return indicator.label;
            });

            var countries = _.map(vizModel.activeCountries(), function(country) {
                return country.geounit;
            });



            var hashString = "y=1990|2014" + // + vizModel.activeYears().join("|")
                "&f=" + vizModel.activeYears().join("|") +
                "&i=" + indicators.join("|") +
                "&l=" + indicatorLabels.join("|") +
                "&c=" + type + "&g=" + vizModel.activeGroup().id +
                "&r=" + vizModel.activeRegion() +
                "&cn=" + countries.join("|");

            window.location.href = "/data-visualization#" + hashString;



        },

        selectCountry: function(selectedCountry, evt, direct) {

            if (direct) {
                window.location.href = "data-visualization#y=1990|2014&f=1990|2014&i=gdp_per_capita&l=GDP+Per+Capita&c=line&g=all&r=&cn=" + selectedCountry.geounit
            }

            var selectedCountry = arguments[0];
            var countryLabel = selectedCountry.label;
            var countryId = selectedCountry.code;

            vizModel.activeCountries.push(selectedCountry);

            var countriesModel = _.clone(vizModel.countriesModel(), true);
            vizModel.countriesModel.removeAll();
            _.forEach(countriesModel, function(country) {
                if (countryLabel == country.label) {
                    country.selected = !country.selected;
                }
                vizModel.countriesModel.push(country);
            })
            //vizModel.countriesModel(response.data);
            //vizModel.countriesModelMaster(_.clone(response.data, true));

            // vizModel.activeCountries.push(arguments[0]);

            var current = vizModel.selectionTracker();
            current.filter = true;
            vizModel.selectionTracker(current);

            // $('#vizTabs a[href="#select-indicator"]').tab('show');
        },

        removeCountry: function() {

            var selectedCountry = arguments[0];
            var activeCountries = vizModel.activeCountries();
            var selectedIndex = _.indexOf(activeCountries, selectedCountry);

            vizModel.activeCountries.splice(selectedIndex, 1);

            // _.each(activeCountries, function(country){
            // 	if (geounit)
            // });
            // vizModel.activeCountries.push(selectedCountry);

        },


        clearActiveCountries: function() {

            vizModel.activeCountries.removeAll();

        },

        selectCountryGroup: function() {



            var groupId = arguments[0].id;

            window.changeGroup(groupId);

            vizModel.activeGroup(arguments[0]);
            vizModel.activeRegion(""); //set active region to undefined


            vizModel.countryGroupRegions.removeAll();


            if (groupId == "all") {
                vizModel.selectCountryGroupRegion("all"); //just select all countries
            } else {
                //assign region to countryGroupRegion


                _.forEach(vizModel.countryGroupings(), function(countryGroup) {
                    if (groupId == countryGroup.id) {
                        vizModel.countryGroupRegions(_.clone(countryGroup.regions, true));
                        vizModel.selectCountryGroupRegion(countryGroup.regions[0]);
                    }
                })

            }



        },

        selectCountryGroupRegion: function() {
            var selectedRegion = arguments[0];
            var selectedGroup = vizModel.activeGroup();

            vizModel.activeRegion(selectedRegion);
            vizModel.countriesModel.removeAll();

            var countriesModelMaster = _.clone(vizModel.countriesModelMaster(), true);

            _.forEach(countriesModelMaster, function(country) {
                if (selectedRegion == "all") {
                    vizModel.countriesModel.push(country);
                } else if (_.has(country.regions, selectedGroup.id) && country.regions[selectedGroup.id] == selectedRegion) {
                    vizModel.countriesModel.push(country);
                }

            })

            //filter country view by region

        },

        expandCategory: function(model, evt) {

            expandedCategory = true;


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
            var charCode = evt.charCode;
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

        },


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
            "label": "All",
            "regions": []
        }),

        activeRegion: ko.observable(""),


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

        newSearch: ko.observable(true)


    }

}())