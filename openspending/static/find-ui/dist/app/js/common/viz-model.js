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

        downloadData: function(format, indicator, evt) {


            evt.stopPropagation();

            window.clickedIndicator = true;

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


        removeIndicator: function(selectedIndicator) {

            var indicatorIndex = _.indexOf(vizModel.activeIndicators(), selectedIndicator);
            var categoriesModel = _.clone(vizModel.categoriesModel(), true);
            var sourcesModel = _.clone(vizModel.sourcesModel(), true);

            vizModel.activeIndicators.splice(indicatorIndex, 1);
            vizModel.indicatorsModel.removeAll();
            _.forEach(vizModel.indicatorsModelMaster(), function(indicator) {
                if (selectedIndicator.id == indicator.id) {
                    indicator.selected = !indicator.selected;
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
            //debugger;

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


            if (direct) {
                //TODO: Calculate Year Extremes
                window.location.href = "data-visualization#f=1990|2014&i=" + selectedIndicator.id + "&c=line&g=dos_region&r=&cn=";
                return;
            }

            window.clickedIndicator = true;

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

        },

        selectVizualization: function(type) {

            var groupByRegion = vizModel.groupByRegion();
            var allowMultivariate = ["scatter", "radar", "tree"];
            var allowSinglevariate = ["line", "bar"];
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


        selectCountry: function(selectedCountry, evt, goToVisualize, breakdown) { /* breakdown by regions or countries*/

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
                window.location.href = "data-visualization#f=1990|2014&i=gdp_per_capita&c=line&r" + selectedCountry.geounit
                return;
            }

            // var selectedCountry = arguments[0];
            if (selectedCountry.selected) {
                return false;
            }
            var countryLabel = selectedCountry.label;
            var countryId = selectedCountry.id;

            vizModel.activeCountries.push(selectedCountry);

            var countriesModelMaster = _.clone(vizModel.countriesModelMaster(), true);
            vizModel.countriesModelMaster.removeAll();


            var countryGroupings = _.clone(vizModel.countryGroupings(), true);
            vizModel.countryGroupings.removeAll();

            var activeGroupId = vizModel.activeGroup().id;

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
                    vizModel.activeGroup(countryGroup);
                }
                vizModel.countryGroupings.push(countryGroup);
            });

        },



        removeCountry: function() {

            var selectedCountry = arguments[0];
            var activeCountries = vizModel.activeCountries();
            var selectedIndex = _.indexOf(activeCountries, selectedCountry);

            vizModel.activeCountries.splice(selectedIndex, 1);

            var countryLabel = selectedCountry.label;
            var countryId = selectedCountry.id;

            //vizModel.activeCountries.removeAll();

            var countryGroupings = _.clone(vizModel.countryGroupings(), true);
            vizModel.countryGroupings.removeAll();

            var activeGroupId = vizModel.activeGroup().id;
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
                    vizModel.activeGroup(countryGroup);
                }
                vizModel.countryGroupings.push(countryGroup);
            });

            return;

            var countriesModelMaster = _.clone(vizModel.countriesModelMaster(), true);
            vizModel.countriesModelMaster.removeAll();

            var countriesModel = _.clone(vizModel.countriesModel(), true);
            vizModel.countriesModel.removeAll();
            _.forEach(countriesModel, function(country) {
                if (countryId == country.iso_a2) {
                    country.selected = !country.selected;
                }
                vizModel.countriesModel.push(country);
            });

            _.forEach(countriesModelMaster, function(country) {
                if (countryId == country.iso_a2) {
                    country.selected = !country.selected;
                }
                vizModel.countriesModelMaster.push(country);
            });

            // _.each(activeCountries, function(country){
            // 	if (geounit)
            // });
            // vizModel.activeCountries.push(selectedCountry);

        },


        clearActiveCountries: function() {

            vizModel.activeCountries.removeAll();

            var countryGroupings = _.clone(vizModel.countryGroupings(), true);
            vizModel.countryGroupings.removeAll();

            var activeGroupId = vizModel.activeGroup().id;

            _.forEach(countryGroupings, function(countryGroup, i) {
                countryGroup.selected = false;
                _.forEach(countryGroup.regions, function(region) {
                    region.selected = false;
                    _.forEach(region.countries, function(country) { //for each Country
                        country.selected = false;
                    });

                });
            });

            _.forEach(countryGroupings, function(countryGroup, i) {
                if (activeGroupId == countryGroup.id) {
                    vizModel.activeGroup(countryGroup);
                }
                vizModel.countryGroupings.push(countryGroup);
            });

            return;

            var countriesModelMaster = _.clone(vizModel.countriesModelMaster(), true);
            vizModel.countriesModelMaster.removeAll();

            var countriesModel = _.clone(vizModel.countriesModel(), true);
            vizModel.countriesModel.removeAll();
            _.forEach(countriesModel, function(country) {
                country.selected = false;
                vizModel.countriesModel.push(country);
            });

            _.forEach(countriesModelMaster, function(country) {
                country.selected = false;
                vizModel.countriesModelMaster.push(country);
            });

            window.utils.highlightOnMap(vizModel, true)

        },

        clearActiveIndicators: function() {

            vizModel.activeIndicators.removeAll();


            var categoriesModel = _.clone(vizModel.categoriesModel(), true);
            var sourcesModel = _.clone(vizModel.sourcesModel(), true);


            vizModel.indicatorsModel.removeAll();
            _.forEach(vizModel.indicatorsModelMaster(), function(indicator) {
                indicator.selected = false;
                vizModel.indicatorsModel.push(indicator);
            });


            vizModel.categoriesModel.removeAll();
            _.forEach(categoriesModel, function(category) {
                _.forEach(category.indicators, function(indicator) {
                    indicator.selected = false;
                });
                vizModel.categoriesModel.push(category);
            });
            //debugger;

            vizModel.sourcesModel.removeAll();
            _.forEach(sourcesModel, function(source) {
                _.forEach(source.indicators, function(indicator) {
                    indicator.selected = false;
                });
                vizModel.sourcesModel.push(source);
            });

            window.flipCardEvent();

        },

        selectCountryGroup: function() {



            var groupId = arguments[0].id;

            //window.changeGroup(groupId);

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
                });

            }



        },

        selectCountryGroupRegion: function() {
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

            window.utils.highlightOnMap(vizModel, true);
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

        groupChange: function() {

            debugger;

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
            "label": "All Countries",
            "regions": []
        }),

        activeRegion: ko.observable(""),

        groupByRegion: ko.observable(false),

        countriesModel: ko.observableArray([]),

        countriesModelMaster: ko.observableArray([]),

        countryGroupings: ko.observableArray([{
            "id": "all",
            "label": "All Countries",
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

    window.vizModel.groupByRegion.subscribe(function(newValue) {

    });

}())