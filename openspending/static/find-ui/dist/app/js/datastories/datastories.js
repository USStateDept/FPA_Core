(function() {

   var indicator = "under_five_mortality_rate_u5mr";
   var indicators = [indicator];
   var regions = "dos_region";
   
   var yearFrom = "1990";
   var yearTo = "2014";
   var yearsExtremesForData = [yearFrom, yearTo];
   var yearsFilter = [yearFrom, yearTo];
   
   var type = "line";
   var chartType = type;
   
   var dataUrl = '/api/3/slicer/aggregate?&cluster=jenks&numclusters=4&cubes='+indicator+'&daterange='+yearFrom+'-'+yearTo+'&order=time&drilldown=geometry__country_level0@'+regions+'|geometry__time';
   var globalDataUrl = 'api/3/slicer/aggregate?&cluster=jenks&numclusters=4&cubes='+indicator+'&daterange='+yearFrom+'-'+yearTo+'&order=time&drilldown=geometry__time';
   var metaUrl = 'api/3/datasets/' + indicator;
   
   var data;
   var meta;
   var global;
   
   function ajax1(){
       return $.ajax({
            url: dataUrl,
            dataType: "json",
            data: {

            }
        });
   }
    
    function ajax2(){
        return $.ajax({
            url: globalDataUrl,
            dataType: "json",
            data: {

            }
        });
    }
    

    $.when(ajax1(), ajax2()).done(function(data, global){

        meta = data[0]['models'][indicator];

        var cutBy = regions;
        var mergedCells = [];
        
        _.forEach(data[0].cells, function(cell) {
            
            cell.region = cell["geo__" + cutBy];

            cell.year = cell.time;

            delete cell.time;
            delete cell["geo__" + cutBy];
            delete cell.count;

            for (var id in cell) {
                if (id.indexOf("__max") > -1) {
                    delete cell[id];
                }

                if (id.indexOf("__min") > -1) {
                    delete cell[id];
                }

                if (id.indexOf("__sum") > -1) {
                    delete cell[id];
                }
            }

        });

        mergedCells = mergedCells.concat(data[0].cells);

        var responseData = {
            cells: mergedCells
        }


        var sortedData = window.utils.prepareHighchartsJson(responseData, global[0], type, indicators, yearsExtremesForData);
        var highChartsJson = sortedData.highcharts;
        highChartsJson.chart.events = {
            load: function() {
                var allowedSetExtremeCharts = ["line"];
                var xAxis = this.series[0].xAxis;
                if (_.indexOf(allowedSetExtremeCharts, chartType) > -1) {
                    xAxis.setExtremes(yearsFilter[0], yearsFilter[1]);
                }
                var globalAvg = this.series[0].chart.series[2];
                globalAvg.setVisible(true);
            }
        }
        
        var chart = $('#datastories-chart').highcharts(highChartsJson);
        
    });

}())