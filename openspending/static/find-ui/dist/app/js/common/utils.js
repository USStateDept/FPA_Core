(function() {
    window.getHashParams = function() {

        var hashParams = {};
        var e,
            a = /\+/g, // Regex for replacing addition symbol with a space
            r = /([^&;=]+)=?([^&;]*)/g,
            d = function(s) {
                return decodeURIComponent(s.replace(a, " "));
            },
            q = window.location.hash.substring(1);

        while (e = r.exec(q))
            hashParams[d(e[1])] = d(e[2]);

        return hashParams;
    }

    window.updateHash = function(hashObj) {

        var result = decodeURIComponent($.param(hashObj));
        window.location.hash = result; //console.log("fdfsd");
    }


    window.bindIndicators = function(response, model) {
        //debugger;
        var categoriesAll = response.data.categories;
        var subcategoriesAll = response.data.subcategories;
        var sourcesAll = response.data.sources;
        var indicatorsAll = response.data.indicators;

        var categoriesModel = [];
        var sourcesModel = [];
        var indicatorsModel = [];

        //Sort out Categories
        for (var cat in categoriesAll.data) {

            var isOnlyCategory = function(indicatorId) {
                return indicatorsAll.data[indicatorId].subcategory === "None";
            }

            var isSubCategory = function(indicatorId) {
                return indicatorsAll.data[indicatorId].subcategory != "None";
            }

            var makeIndicator = function(indicatorId) {
                var sourceId = _.get(indicatorsAll, 'data[indicatorId].source');
                var sourceLabel = _.get(sourcesAll, 'data[sourceId].label');

                var cloneIndicator = _.clone(indicatorsAll.data[indicatorId], true);

                cloneIndicator.source = sourceLabel;
                cloneIndicator.id = indicatorId;
                cloneIndicator.selected = false;

                return cloneIndicator;
            }

            var indicatorsIdsInCategory = _.filter(categoriesAll.data[cat].indicators, _.negate(isSubCategory));

            var indicatorsIdsInSubCategory = _.filter(categoriesAll.data[cat].indicators, _.negate(isOnlyCategory));

            var indicatorsInCategory = _.map(indicatorsIdsInCategory, makeIndicator);
            var indicatorsInSubCategory = _.map(indicatorsIdsInSubCategory, makeIndicator);

            //arrange subcategories in order
            var subcategories = [];

            var subcategoriesTracker = [];

            _.forEach(indicatorsInSubCategory, function(indicator) {

                var subCatIndex = _.indexOf(subcategoriesTracker, indicator.subcategory);

                if (subCatIndex < 0) {
                    //debugger;
                    var newSubCategory = {
                        "id": indicator.subcategory,
                        "label": subcategoriesAll.data[indicator.subcategory].label,
                        "indicators": [indicator],
                        "selected": false
                    }
                    subcategoriesTracker.push(indicator.subcategory);
                    subcategories.push(newSubCategory);
                } else {
                    subcategories[subCatIndex].indicators.push(indicator);
                }

            });

            if (subcategories.length > 0 && indicatorsInCategory.length > 0) {
                var generalSubCategory = {
                    "label": "General",
                    "indicators": indicatorsInCategory,
                    "selected": false
                }
                subcategories.unshift(generalSubCategory);
            }


            //debugger;
            var newCategory = {
                "label": categoriesAll.data[cat].label,
                "length": categoriesAll.data[cat].indicators.length,
                "indicators": indicatorsInCategory,
                "subcategories": subcategories
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
    }

    window.bindCountries = function(response, model) {



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
            country.selected = false;
        });


        model.countriesModel(response.data);
        model.countriesModelMaster(_.clone(response.data, true));
    }

    window.highlightOnMap = function(region, type) {

        var label = region.label;
        var style = function(feature) {

            if (label == feature.properties.sovereignt) {
                return {
                    weight: 2,
                    opacity: 1,
                    color: 'red',
                    dashArray: '3',
                    fillOpacity: 0.3,
                    fillColor: '#ff0000'
                };
            } else {
                return {
                    weight: 2,
                    opacity: 1,
                    color: 'white',
                    dashArray: '3',
                    fillOpacity: 0.3,
                    fillColor: '#666666'
                };
            }
        }

        window.map.removeLayer(geoJsonLayers["sovereignt"]);

        L.geoJson(geoJsonLayers["sovereignt"].toGeoJSON(), {
            style: style
        }).addTo(window.map);
    }

}())