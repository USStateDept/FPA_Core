var act;

// test code for #228
// function onMapClick(e) {
//     alert("You clicked the map at " + e.latlng);
// }
// $("#map").on('click', onMapClick);

(function() {
    window.utils = {};

    window.utils.masterCells = [];

    window.utils.statsData = [];

    window.utils.flipCardEvent = function() {

        $(".flip").click(function() {

            if (window.expandedCategory) {
                window.expandedCategory = false;
                return;
            }

            if (window.clickedIndicator) {
                window.clickedIndicator = false;
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

    window.utils.getHashParams = function() {

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

    window.utils.updateHash = function(hashObj) {

        var result = decodeURIComponent($.param(hashObj));
        window.location.hash = result;
    }

    window.utils.bindIndicators = function(response, model) {



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

            var newSourceArray = ["MCC","CDA","DHS","SDG",,"UIS","WHO","IMF"];
            var label=newSource.label.split("-")[0].trim();
            // console.log(newSource.label);
            if (newSourceArray.indexOf(label)!=-1){
                // console.log("REACHED THIS LINE");
                sourcesModel.push(newSource);
            }

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
    };

    window.utils.bindCountries = function(response, model) {


        model.countryGroupings(response['data']['regions']);


        model.countriesModel(response['data']['countries']);

        model.countriesModelMaster(_.clone(response['data']['countries'], true));

        model.activeGroup(model.countryGroupings()[0]);
    };

    window.utils.removeOnMap = function() { //clear a single country
        window.map.removeLayer(window.visualization.geoJsonLayers[level]);
    };

    window.utils.clearOnMap = function(model) { // clear all of map
        // debugger;
        var levels = model.countryGroupings();
        //["sovereignt","usaid_reg","continent","dod_cmd","dos_region","wb_inc_lvl"]
        //var level = "sovereignt";
        debugger;
        _.forEach(levels, function(_l) {
            var layerId = _l.id;
            if (layerId == "all") {
                layerId = "sovereignt";
            }
            var layer = window.visualization.geoJsonLayers[layerId];
            if (layer) {
                window.map.removeLayer(layer);
            }
        })

    };

    window.utils.zoomToFeatures = function(features) {

        var group = new L.featureGroup(features);
        var bounds = group.getBounds();

        //debugger;
        var southWestLng = bounds._southWest.lng;
        var northEastLng = bounds._northEast.lng;

        bounds._southWest.lng = bounds._southWest.lat;
        bounds._southWest.lat = southWestLng;
        bounds._northEast.lng = bounds._northEast.lat;
        bounds._northEast.lat = northEastLng;


        map.fitBounds(bounds);

        console.timeEnd("choropleth");
        // debugger;
    };

    window.utils.highlightOnMapViz = function(regions, type, cluster, indicator, gjson) {

        if (window.loader.geoJsonLayers[type]) {
            map.removeLayer(window.loader.geoJsonLayers[type]);
        }

        var geojson = gjson['features'];
        var featuresAdded = [];
        var style = function(feature) {

            var name = feature.properties.sovereignt || feature.properties.usaid_reg || feature.properties.continent || feature.properties.dod_cmd || feature.properties.dos_region || feature.properties.wb_inc_lvl;
            //console.log("*********feature" + feature);
            if (!name) {
                return {
                    weight: 0,
                    opacity: 0,
                    color: 'white',
                    dashArray: '3',
                    fillOpacity: 0.0,
                    fillColor: '#666666'
                };
            }

            if (regions[0].indexOf(":") > -1) {
                name = type + ":" + name;
            } else { //if country
                name = name.toLowerCase();
            }

            if ( regions[0].indexOf(name) > -1 || regions.indexOf(name) > -1) {

                var polygon = L.multiPolygon(feature.geometry.coordinates);
                //debugger;
                featuresAdded.push(polygon);
                //debugger;
                return {
                    weight: 2,
                    opacity: 1,
                    color: '#FFFFFF',
                    //dashArray: '3',
                    fillOpacity: 0.5,
                    fillColor: window.utils.getColor(feature.properties[indicator], cluster)
                    //fillColor: '#00FF00'////fillColor: '#00FF00'
                };
            } else {
                return {
                    weight: 1,
                    opacity: 1,
                    color: 'white',
                    //dashArray: '3',
                    fillOpacity: 0.5,
                    fillColor: '#666666'
                };
            }
        }

        var highlightFeature = function() {

        }

        var resetHighlight = function() {

        }

        var zoomToFeature = function(e) {
            map.fitBounds(e.target.getBounds());
        }

        var onEachFeature = function(feature, layer) {
            //  debugger;
            console.log("onEachFeature");
            // does this feature have a property named popupContent?
            if (feature.properties) {
                var name = feature.properties.sovereignt || feature.properties.usaid_reg || feature.properties.continent || feature.properties.dod_cmd || feature.properties.dos_region || feature.properties.wb_inc_lvl;
                var popupText = name;
                if (feature.properties[indicator]) {
                    popupText += "</br>" + feature.properties[indicator];
                }
                layer.bindPopup(popupText);
                layer.bindLabel(name, {noHide:true,direction:'right'});
            }

            layer.on({
                mouseover: highlightFeature,
                mouseout: resetHighlight,
                click: zoomToFeature
            });
        }

        map.once('layeradd', function() {
            //debugger;
            //console.log("layerAdd");
            window.utils.zoomToFeatures(featuresAdded);
        });

        //var level = "sovereignt";
        /* var isCountry = geounit.iso_a2;
        var drillDown = false;
        debugger;*/
        /* if (isCountry) {
            level = "sovereignt";
        } else {
            level = geounit.geounit.split(":")[0];
            drillDown = _.indexOf(geounit.geounit.split(":"), "all") > -1;
        }*/

        window.loader.geoJsonLayers[type] = L.geoJson(window.loader.geoJson[type], {
            onEachFeature: onEachFeature,
            style: style
        });

        map.addLayer(window.loader.geoJsonLayers[type]);


        //window.utils.addLegend();
    };



    window.utils.getColor = function(d, cluster) {


        var breaks = cluster.data;
        var color = '#CCCCCC'; //default
        var colorRamp = ['#800026', '#BD0026', '#E31A1C', '#FC4E2A', '#FD8D3C', '#FEB24C', '#FED976', '#FFEDA0'];
        _.forEach(breaks, function(_b, i) {
            if (d >= _b) {
                color = colorRamp[i];
            }
        })

        //  debugger;
        return color;
    };

    window.utils.addLegend = function(cluster) {

        var legend = L.control({
            position: 'topright'
        });

        var breaks = cluster.data;
        var labels = cluster.labels;
        var legendLabels = [];
        // debugger;
        legend.onAdd = function(map) {
            //debugger;
            var div = L.DomUtil.create('div', 'info legend'),
                grades = breaks;

            _.forEach(breaks, function(_b, i) {
                //debugger;
                var from = _.round(_b, 2);
                var to = _.round(grades[i + 1], 2);

                legendLabels.push(
                    '<i style="background:' + window.utils.getColor(from + 1, cluster) + '"></i> ' +
                    from + (to ? ' &ndash; ' + to : '+'));

            });

            legendLabels.push('<i style="background:#CCCCCC"></i> No Data');
            //debugger;
            div.innerHTML = legendLabels.join('<br>');
            return div;
        };

        legend.addTo(map);

    };

    window.utils.highlightOnMap = function(model, geounit) {
        // remove from map feauture
        if(geounit.selected == false) {
          //window.utils.clearOnMap(vizModel);
          // setTimeout(function(){
          //   window.utils.highlightOnMap(vizModel, vizModel.activeCountries()[0]);
          // },25);
          //window.map.removeLayer(window.visualization.geoJsonLayers[level]);
           //debugger;
          // // window.visualization.changeGroup("all");
          // //
          for(var i = 0; i  < vizModel.activeCountries().length; i++) {
            // redraw Map
            debugger;
            window.utils.highlightOnMap(vizModel, vizModel.activeCountries()[i]);
          }

          return;
        }

        var featuresAdded = [];
        //if all then select all countries in countriesModel, else activeCountries
        var isCountry = geounit.iso_a2;
        var drillDown = false;

        if (isCountry) {
            level = "sovereignt";
        } else {
            level = geounit.geounit.split(":")[0];
            drillDown = _.indexOf(geounit.geounit.split(":"), "all") > -1;
        }

        //first remove the layer
        var activeCountries = model.activeCountries();
        act = activeCountries;

        var listOfLabels = _.map(activeCountries, function(_a) {
            return _a.label;
        });

        var drillDownLabels = [];

        if (drillDown) {
            if (geounit.countries) {
                level = "sovereignt";
                var drillDownLabels = _.map(geounit.countries, function(_a) {
                    return _a.label;
                });
            }
            if (geounit.regions) {
                level = geounit.geounit.split(":")[0];
                var drillDownLabels = _.map(geounit.regions, function(_a) {
                    return _a.label;
                });
            }
        }

        var style = function(feature) {
            if ((drillDown && (_.indexOf(drillDownLabels, feature.properties[level]) > -1)) || (feature.properties[level] == geounit.label) || _.indexOf(listOfLabels, feature.properties[level]) > -1) {
                //debugger;
                var polygon = L.multiPolygon(feature.geometry.coordinates);

                featuresAdded.push(polygon);
                return {
                    weight: 2,
                    opacity: 1,
                    color: '#FFFFFF',
                    //dashArray: '3',
                    fillOpacity: 1.0,
                    fillColor: '#852224'
                };
            } else {
                return {
                    weight: 1,
                    opacity: 1,
                    color: 'white',
                    dashArray: '3',
                    fillOpacity: 1.0,
                    fillColor: 'grey'
                };
            }
        }

        var onEachFeature = function(feature, layer) {

            // does this feature have a property named popupContent?
            if (feature.properties) {
                var name = feature.properties.sovereignt || feature.properties.usaid_reg || feature.properties.continent || feature.properties.dod_cmd || feature.properties.dos_region || feature.properties.wb_inc_lvl;
                layer.bindPopup(name);
                layer.bindLabel(name, {noHide:true,direction:'right'});
            }
        }

        window.visualization.geoJsonLayers[level] = L.geoJson(window.visualization.geoJson[level], {
            onEachFeature: onEachFeature,
            style: style
        });

        map.addLayer(window.visualization.geoJsonLayers[level]);
    }

    window.utils.prepareHighchartsJson = function(data, statsData, indicatorsMeta, type, indicators, yearsExtremesForData) {
        //debugger;
        //var defaultCountries = ["australia", "new zealand", "sweden", "germany", "france", "ghana", "kenya", "south africa", "bangladesh", "pakistan", "cambodia"];
        //var defaultVisibleCountries = ["australia", "germany", "kenya", "cambodia"];

        var cells = data.cells;
        //debugger;
        var statsCells = statsData.cells;
        var indicatorId = indicators[0];
        var title = indicators[0];
        //var groupId = group;
        //var cutBy = "name";
        var dataType = "avg"; //sum,avg
        var multiVariate = indicators.length > 1; //eligible for scatter plot
        // var seriesAverage = [];
        // var dataByYear = [];

        var fromYear = 1990; //timeCell.from[0];
        var toYear = 2015; //timeCell.to[0];

        var categories = [];

        for (var i = fromYear; i <= toYear; i++) {
            categories.push(parseInt(i));
        }

        var series = {
            "Global Minimum": [],
            "Global Maximum": [],
            "Global Average": [],
        };


        //Add stats to series
        _.forEach(statsCells, function(c) {
            //(c["geometry__time"] >= fromYear) && (c["geometry__time"] <= toYear) &&
            //if ((groupId == "all" || c["geometry__country_level0." + groupId] == region)) {
            series["Global Minimum"].push([c["geometry__time"], c[indicatorId + "__amount_min"]]);
            series["Global Maximum"].push([c["geometry__time"], c[indicatorId + "__amount_max"]]);
            series["Global Average"].push([c["geometry__time"], c[indicatorId + "__amount_avg"]]);
            // }
        });



        //debugger;
        var seriesArray = [];
        if (window.utils.masterCells.length == 0)
            window.utils.masterCells = cells;
        //debugger;
        if (window.utils.statsData.length == 0)
            window.utils.statsData = statsCells;

        var _cells = cells; //window.utils.masterCells;
        //debugger;
        _.forEach(_cells, function(c) {
            if (c.region) {
                series[c.region] = [];
            }
        });

        _.forEach(_cells, function(c) {
            if (c.region) {
                series[c.region].push([c.year, c[indicatorId + "__amount_" + dataType]]);
            }
        });

        //debugger;
        var titleArray = _.map(indicatorsMeta, function(meta) {

            var title = meta[0].label;
            var units = meta[0].units;

            units = units == null ? "" : "(" + units + ")";

            return title + units;
        });

        var xUnits = indicatorsMeta[0][0].units;

        var yUnits;
        if (type == "scatter" || type == "bubble") {
            yUnits = indicatorsMeta[1][0].units;
        }

        var zUnits;

        if (type == "bubble") {
            zUnits = indicatorsMeta[2][0].units;
        }

        xUnits = xUnits == null ? "" : " (" + xUnits + ")";
        yUnits = yUnits == null ? "" : " (" + yUnits + ")";
        zUnits = zUnits == null ? "" : " (" + zUnits + ")";

        var title = titleArray.join(" and ");


        var subtitleObj = _.map(indicatorsMeta, function(meta) {
            return meta = {
                "label": meta[0].label,
                "url": meta[0].url,
                "dataorg": meta[0].dataorg
            };
        });

        var subtitleArray = _.map(subtitleObj, function(subtitleArray, i) {
            var source = subtitleObj[i].dataorg || '-';
            //return subtitleArray = subtitleObj[i].label + ' (<a href="'+subtitleObj[i].url+'" style="color:#852224" target="_blank">'+source+'</a>)';
            return subtitleArray = subtitleObj[i].label + ' (<a href="" target="_blank">' + source + '</a>)';
        });
        //debugger;
        var subtitle = "Sources: " + subtitleArray.join(", ");

        var counter = 1;
        var countriesArr = [];
        Object.size = function(obj) {
            var size = 0,
                key;
            for (key in obj) {
                if (obj.hasOwnProperty(key)) size++;
            }
            return size;
        };
        var size = Object.size(series);

        for (var countryName in series) {
            var visible = false;
            // if (defaultVisibleCountries.indexOf(countryName) > -1) {
            visible = true;
            //  }
            //window.averageSeries = series[countryName];
            // if (defaultCountries.indexOf(countryName) > -1) {
            //debugger;
            // console.log("series[countryName] is: " + series[countryName]);

            function inBounds(a) {
                var inStatus = true;
                $.each(a, function(k, v) {
                    // console.log("Index is: " + v[1]);
                    if (v[1] < 1 && v[1] != null) {
                        inStatus = false;
                        // console.log("The value of v triggering the change is: " + v);
                        // alert("The value of v triggering the change is: " + v);
                    }
                });
                // console.log("inStatus is: " + inStatus);
                return inStatus;
            }
            // seriesArray.push({
            //     name: countryName,
            //     data: series[countryName],
            //     visible: inBounds(series[countryName]) && (counter > 3 || size == 3) ? true : false,
            //     zIndex: counter++
            // });

            seriesArray.push({
                name: countryName,
                data: series[countryName],
                visible: (counter > 3 || size == 3) ? true : false,
                zIndex: counter++
            });

            countriesArr.push(countryName);


            // }
        }
        //debugger;
        seriesArray[0].zIndex = seriesArray.length + 1;
        seriesArray[1].zIndex = seriesArray.length + 2;
        seriesArray[2].zIndex = seriesArray.length + 3;

        //debugger;

        var chartObj = {

            type: type
        };

        if (type == "radar") {
            chartObj.polar = true;
            chartObj["type"] = "line";
        }

        var ymin = inBounds(series[countryName]); //if there are neg values, return false; otherwise return true

        var jsonLine = {
            chart: chartObj,
            title: {

                text: title,
                x: -20
            },
            subtitle: {

                text: subtitle,
                x: -20
            },
            xAxis: {
                //categories: categories
                title: {
                    enabled: true,
                    text: 'Years'
                },
                startOnTick: true,
                endOnTick: true,
                showLastLabel: true
            },
            yAxis: {
                title: {
                    text: title
                },
                min: ymin ? 0 : null,
                plotLines: [{
                    value: 0,
                    width: 0.25,
                    color: '#FFFFCC'
                }]
            },
            tooltip: {
                valueSuffix: '',
                shared: false,
                pointFormat: '<span style="color:{point.color}">●</span> {series.name}: <b>{point.y:,.2f}</b><br/>'

            },
            legend: {
                layout: 'vertical',
                align: 'right',
                verticalAlign: 'middle',
                borderWidth: 0,
                width: 200,
                itemWidth: 100
            },
            series: seriesArray
        }

        //debugger;
        // x - indicator 1
        // y indicator 2
        // one year
        // one region
        // size on bubble would be the third indicator
        // user should be able to switch between the x, y and z
        var latestYear = yearsExtremesForData[1];
        var firstYear = yearsExtremesForData[0];
        
        if (type == "scatter") {

            seriesArray = [];

            //debugger;

            var indicator1 = indicators[0];
            var indicator2 = indicators[1];

            series = [];
            var globalType;
            var indicatorSuffix;

            for (i = 0; i < 3; i++) {
                switch (i) {
                    case 0:
                        globalType = "Global Minimum";
                        indicatorSuffix = "min";
                        break;
                    case 1:
                        globalType = "Global Maximum";
                        indicatorSuffix = "max";
                        break;
                    case 2:
                        globalType = "Global Average";
                        indicatorSuffix = "avg";
                        break;
                }
                dataArray = [];
                //debugger;
                _.forEach(statsCells, function(c) {
                    //if (c.geometry__time <= latestYear)
                    dataArray.push({
                        x: c[indicator1 + "__amount_" + indicatorSuffix],
                        y: c[indicator2 + "__amount_" + indicatorSuffix],
                        year: c.geometry__time
                    });
                });
                var visible = size == 3 ? true : false;
                series.push({
                    name: globalType,
                    data: dataArray,
                    visible: visible,
                    tooltip: {
                        pointFormat: '<b>' + indicator1 + ':</b> {point.x}<br/><b>' + indicator2 + ':</b> {point.y}<br/><b>year :</b> {point.year}'
                    },
                });
            }
            //debugger;
            _.forEach(_cells, function(c) {
                //debugger;
                if (latestYear == c.year) {
                    dataArray = [];
                    _.forEach(_cells, function(d) {
                        if (c.region == d.region && d.year >= firstYear && d.year <= latestYear) {
                            if (!!d[indicator1 + "__amount_" + dataType] && !!d[indicator2 + "__amount_" + dataType])
                                dataArray.push({
                                    x: d[indicator1 + "__amount_" + dataType],
                                    y: d[indicator2 + "__amount_" + dataType],
                                    year: d.year
                                });
                        }
                    });
                    //debugger;
                    series.push({
                        name: c.region,
                        data: dataArray,
                        tooltip: {
                            pointFormat: '<b>' + indicator1 + ':</b> {point.x}<br/><b>' + indicator2 + ':</b> {point.y}<br/><b>year :</b> {point.year}'
                        },
                    });
                }
            });

            var jsonScatter = {

                chart: {
                    type: 'scatter',
                    zoomType: 'xy'
                },

                title: {
                    text: title
                },
                subtitle: {
                    text: subtitle
                },
                xAxis: {
                    title: {
                        enabled: true,
                        text: indicatorsMeta[0][0].label + xUnits
                    },
                    startOnTick: true,
                    endOnTick: true,
                    showLastLabel: true
                },
                yAxis: {
                    title: {
                        text: indicatorsMeta[1][0].label + yUnits
                    }
                },
                series: series
            }
        }

        if (type == "bubble") {

            seriesArray = [];


            var indicator1 = indicators[0];
            var indicator2 = indicators[1];
            var indicator3 = indicators[2];

            //debugger;
            _.forEach(statsCells, function(c) {
                if (latestYear == c.geometry__time) {
                    //debugger;
                    series["Global Minimum"] = {
                        data: [c[indicator1 + "__amount_min"], c[indicator2 + "__amount_min"], c[indicator3 + "__amount_min"]],
                        year: c.geometry__time
                    };
                    series["Global Maximum"] = {
                        data: [c[indicator1 + "__amount_max"], c[indicator2 + "__amount_max"], c[indicator3 + "__amount_max"]],
                        year: c.geometry__time
                    };
                    series["Global Average"] = {
                        data: [c[indicator1 + "__amount_avg"], c[indicator2 + "__amount_avg"], c[indicator3 + "__amount_avg"]],
                        year: c.geometry__time
                    };

                }
            });

            _.forEach(_cells, function(c) {
                if (c.region) {
                    series[c.region] = [];
                }
            });

            _.forEach(_cells, function(c) {
                if (c.region) {
                    if (latestYear == c.year) {
                        series[c.region] = {
                            year: c.year,
                            data: [c[indicator1 + "__amount_" + dataType], c[indicator2 + "__amount_" + dataType], c[indicator3 + "__amount_" + dataType]]
                        };
                    }
                }
            });

            //debugger;
            var counter = 1;
            var countriesArr = [];
            for (var countryName in series) {
                var visible = false;
                visible = true;
                seriesArray.push({
                    name: countryName,
                    data: [series[countryName].data],
                    visible: counter > 3 || size == 3 ? true : false,
                    zIndex: counter++
                });
            }
            //  debugger;

            var jsonBubble = {

                chart: {
                    type: 'bubble',
                    zoomType: 'xy'
                },

                title: {
                    text: title
                },

                subtitle: {
                    text: subtitle
                },

                xAxis: {
                    //categories: categories
                    title: {
                        enabled: true,
                        text: indicatorsMeta[0][0].label + xUnits
                    },
                    startOnTick: true,
                    endOnTick: true,
                    showLastLabel: true
                },
                yAxis: {
                    title: {
                        text: indicatorsMeta[1][0].label + yUnits
                    }
                },
                zAxis: {
                    title: {
                        text: indicatorsMeta[2][0].label + zUnits
                    }
                },

                series: seriesArray
            }
            //debugger;
        }

        if (type == "bar") {
            //debugger;

            seriesArray = [];

            var data = [];

            //Add stats to series
            _.forEach(statsCells, function(c) {
                if (latestYear == c.geometry__time) {
                    data.push([
                        "Global Minimum",
                        c[indicatorId + "__amount_min"]

                    ]);
                    data.push([
                        "Global Maximum",
                        c[indicatorId + "__amount_max"]

                    ]);
                    data.push([
                        "Global Average",
                        c[indicatorId + "__amount_avg"]

                    ]);
                }
            });


            _.forEach(_cells, function(c) {
                if (c.region && latestYear == c.year) {
                    //debugger;
                    data.push([c.region, c[indicatorId + "__amount_" + dataType]]);
                }
            });

            // [
            //             ['Firefox', 55.0],
            //             ['IE', 16.8],
            //             ['Safari', 7.5],
            //             ['Opera', 7.2],
            //             ['Others', 0.7]
            //         ]

            //debugger;
            seriesArray = [{
                name: indicatorsMeta[0][0].label,
                data: data
            }];

            var jsonBar = {
                chart: {
                    type: 'column'
                },
                title: {
                    text: title
                },
                subtitle: {
                    text: subtitle
                },
                xAxis: {
                    type: 'category',
                    labels: {
                        rotation: -45,
                        style: {
                            fontSize: '13px',
                            fontFamily: 'Verdana, sans-serif'
                        }
                    }
                },
                yAxis: {
                    min: 0,
                    title: {
                        text: title //indicatorsMeta[0][0].label
                    }
                },
                legend: {
                    enabled: false
                },
                tooltip: {
                    formatter: function() {
                        var number = this.point.y
                        return indicatorsMeta[0][0].label + '<br/>' + this.key + ': <b>' + Math.floor(this.point.y) + '</b>'
                    }
                },
                series: seriesArray
            }
            //debugger;
        }

        var json;
        switch (type) {
            case "line":
                json = jsonLine;
                break;
            case "bar":
                json = jsonBar;
                break;
            case "bubble":
                json = jsonBubble;
                break;
            case "scatter":
                json = jsonScatter;
                break;
        }

        //debugger;
        return {
            highcharts: json
            //average: seriesAverage
        };
    }

}())
