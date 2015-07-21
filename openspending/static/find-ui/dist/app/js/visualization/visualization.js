(function() {

    /**
     * Start the Wiard mode
     **/
    window.visualization = {};
    window.clickedIndicator = false;
    window.expandedCategory = false;

    var mapCreated = false;
    window.map;
    window.geoJsonLayers = {};

    window.modalTitle = "";
    window.modalMessage = "";

    $('#modal').modal({
        show: false,
        keyboard: false
    }); // initialized with defaults


    $('#modal').on('show.bs.modal', function(event) {
        var modal = $(this)
        modal.find('.modal-title').text(window.modalTitle);
        modal.find('.modal-body').text(window.modalMessage);
    });

    $(function() {
        // $('#vizTabs a:first').tab('show')
    });

    var geoJSONHandler = function(response, type) {

        function onEachFeature(feature, layer) {

            if (feature.properties) {
                layer.bindPopup(feature.properties.name);
            }
        }

        window.countriesJson = response;

        if (!geoJsonLayers[type]) {
            //debugger;
            geoJsonLayers[type] = L.geoJson(response, {
                style: {
                    weight: 2,
                    opacity: 1,
                    color: 'gray',
                    //dashArray: '3',
                    fillOpacity: 0.2,
                    fillColor: '#cccccc'
                },
                onEachFeature: onEachFeature
            });

            for (var _type in geoJsonLayers) {
                if (type == _type) {
                    map.addLayer(geoJsonLayers[_type]);
                }
            }

        }




        /*else {
                map.removeLayer(geoJsonLayers[_type]);
            }*/

        //geoJsonLayers[type].addTo(map);
        //debugger;
        // geoJsonLayer = L.geoJson(this.collection.toJSON(), {
        //     onEachFeature: _self.onEachFeature
        // });

    }

    window.visualization.changeGroup = function(groupId) {

        if (groupId == "all") {
            groupId = "sovereignt";
        }

        window.loader.loadGeoJSON(groupId, geoJSONHandler);
    }

    window.visualization.createMap = function() {

        var defaultType = "sovereignt";
        //
        if (!mapCreated) {

            mapCreated = true;

            map = L.map('map').setView([0, 0], 1);

            L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>',
                maxZoom: 18
            }).addTo(map);

            //load geojson
            window.visualization.changeGroup("all");
            //window.loader.loadGeoJSON(defaultType, geoJSONHandler);
        }

    }


    var eventBind = function() {

        $(".list-group-item").popover({
            trigger: "hover"
        });

        //var val = $('#filter-years').slider("option", "value");
        window.utils.flipCardEvent();

        // $('.dropdown-toggle').dropdown();


    }







    //KNOCKOUT MODEL

    var model = window.vizModel;



    var countriesListLoadHandler = function(response) {

        window.utils.bindCountries(response, model);
    }



    var indicatorListLoadHandler = function(response) {

        window.utils.bindIndicators(response, model);


        //enable knockout
        ko.applyBindings(model);

        eventBind();

    }

    window.loader.loadIndicatorList(window.config.server + window.config.services.categories, indicatorListLoadHandler);
    window.loader.loadCountries("", countriesListLoadHandler);

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