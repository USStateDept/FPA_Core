/* Array.joinWith - shim by Joseph Myers 7/6/2013 */


if (!Array.prototype.joinWith) {

        Array.prototype.joinWith = function(that, by, select, omit) {
            var together = [], length = 0;
            if (select){ select.map(function(x){select[x] = 1;});}
            function fields(it) {
                var f = {}, k;
                for (k in it) {
                    if (!select) { f[k] = 1; continue; }
                    if (omit ? !select[k] : select[k]){ f[k] = 1;}
                }
                return f;
            }
            function add(it) {
                var pkey = '.'+it[by], pobj = {};
                if (!together[pkey]){ 
                    together[pkey] = pobj;
                    together[length++] = pobj;
                  }
                pobj = together[pkey];
                for (var k in fields(it)){
                    pobj[k] = it[k];}
            }
            this.map(add);
            that.map(add);
            return together;
        };
}

var getAllFields = function(response){
  //might do hierarchy and other options for aggregates like post functions
  var returnlist = {"fields":[], "dimensions":[]};
  $.each(response['aggregates'], function (k,v){
    returnlist['fields'].push({"label": v['label'], "value":response['name'] + "__" + v['name'], "role":"aggregates"});
  });
  // $.each(response['measures'], function (k,v){
  //   returnlist['fields'].push({"label": v['label'], "value":response['name'] + "__" + v['name'], "role":"measures"});
  // });
  $.each(response['dimensions'], function (k,v){
    returnlist['fields'].push({"label": v['label'], "value":response['name'] + "__" + v['name'], "role": "dimensions"});
    returnlist['dimensions'].push({
                "label": v['label'], 
                "value":response['name'] + "__" + v['name'], 
                "levels":v['levels'], 
                "hierarchies":v['hierarchies'], 
                'role':v['role']});
  });
  return returnlist;
};





var getTablefromDict = function(table_dict){
  var tableobj = {};
  if (table_dict.length === undefined){
    //tableobj['headers'] = [];
    tableobj['headers'] = _.keys(table_dict);
    tableobj['data'] = [table_dict];
    //tableobj['data'] = [_.map(table_dict, function(num, key){tableobj['headers'].push(key); return num; })];
  }
  else{
    tableobj['headers'] = _.keys(table_dict[0]);
    tableobj['data'] = table_dict;
    // _.each(table_dict, function(value, key){
    //   tableobj['data'].push(_.map(value, function(num, key){return num; }));
    // });
  }

  return tableobj;
  
};

var getCubeName = function(cubelabel){
  return cubelabel.split("__")[0];
};

var createAggQueryString = function(options){
  //drilldown, cut, fields
  var cubes = [];
  var drilldowns = [];
  var cuts = {};
  var fields = [];
  _.each(options, function(value, cubename){
    if (cubename != "geometry"){
      cubes.push(cubename);
    }
    if (_.has(value, 'drilldowns')){
      drilldowns = _.union(drilldowns, value['drilldowns']);
    }
    if (_.has(value, "cuts")){
      cuts = _.extend(cuts, value['cuts']);
    }
  });
  querystring = "?cubes=" + cubes.join("|");
  if (drilldowns.length !== 0){
    querystring = querystring + "&drilldown=" + drilldowns.join("|");
  }
  if (! _.isEmpty(cuts)){
    var cutarray = [];
    _.each(cuts, function(val,key){
      cutarray.push(key + ":" + val.join(";"));
    });
    querystring = querystring + "&cut=" + cutarray.join("|");
  }
  return querystring;
};


var getDataTableOptions = function(resobj){
  var basekeys = _.keys(resobj[0]);
  var headers = [];
  _.each(basekeys, function(val, key){
    //backslash per https://datatables.net/reference/option/columns.render
    headers.push({data:val.replace('.', '\\.'), title:val.replace('.', '\\.')});
  });
  return {data: resobj,
          columns: headers,
          destroy: true};
};




/**
 * Each section of the site has its own module. It probably also has
 * submodules, though this boilerplate is too simple to demonstrate it. Within
 * `src/app/home`, however, could exist several additional folders representing
 * additional modules that would then be listed as dependencies of this one.
 * For example, a `note` section could have the submodules `note.create`,
 * `note.delete`, `note.edit`, etc.
 *
 * Regardless, so long as dependencies are managed correctly, the build process
 * will automatically take take of the rest.
 *
 * The dependencies block here is also where component dependencies should be
 * specified, as shown below.
 */
var datamodule = angular.module( 'databankjs.datamanager', [
  'ui.router'
])

/**
 * Each section or module of the site can also have its own routes. AngularJS
 * will handle ensuring they are all available at run-time, but splitting it
 * this way makes each module more "self-contained".
 */
.config(function config( $stateProvider ) {
  $stateProvider.state( 'datamanager', {
    url: '/datamanager',
    views: {
      "main": {
        controller: 'DatamanagerCrl',
        templateUrl: 'datamanager/datamanager.tpl.html'
      }
    },
    data:{ pageTitle: 'Data Manager' }
  })
  .state('define', {
    url: '/cubes/:cubeId',
    views: {
      "main": {
        controller: 'CubeOptionsCtrl',
        templateUrl: 'datamanager/cube-options.tpl.html'
      }
    },
    data:{ pageTitle: 'Data Manager' }
  })
  .state('save', {
    url: '/cubes/save',
    views: {
      "main": {
        controller: 'DatamanagerCrl',
        templateUrl: 'datamanager/datamanager.tpl.html'
      }
    },
    data:{ pageTitle: 'Data Manager' }
  })
  .state('search', {
    url: '/cubes',
    views: {
      "main": {
        controller: 'CubesCrl',
        templateUrl: 'datamanager/cube-list.tpl.html'
      }
    },
    data:{ pageTitle: 'Cubes' }
  });
})

.directive('onChosenRender', function ($timeout) {
  return {
      restrict: 'A',
      link: function (scope, element, attr) {
          if (scope.$last === true) {
            //this is hitting twice
              $timeout(function () {
                $(".chosen-select").chosen().change(function(){
                  //sync the data_ids variables
                  scope.data_ids = $(this).val();
                  scope.updateValue("data_id", $(this).val());
                  scope.updateTable();

                });
                $(".chosen-relation").chosen().change(function(){

                  //Not need going to join on country and date
                  //scope.populateDimensions($(this).attr('id') + "_column", $(this).val());
                });
              });
          }
      }
  };
})
.directive('tableRowFinal', function ($timeout) {
  return {
      restrict: 'A',
      link: function (scope, element, attr) {
          if (scope.$last === true) {
              $timeout(function () {
                $('.sortedtable-preview').DataTable({
                  "searching": false,
                  "ordering":  false
                });
              });
          }
      }
  };
})
.factory('OSAPIservice', function($http) {

    var OSAPI = {};


    OSAPI.getCubes = function() {
      return $http({ 
        url: '/api/slicer/cubes'
      });
    };
    OSAPI.getCubeModel = function(cubeId) {
      return $http({ 
        url: '/api/slicer/cube/' + cubeId + '/model'
      });
    };
    OSAPI.getCubesModel = function(cubesId) {
      return $http({ 
        url: '/api/slicer/cube/geometry/cubes_model?cubes=' + cubesId
      });
    };
    OSAPI.getDataPreview = function(urlstring) {
      return $http({
        method: 'JSON', 
        url: "/api/2/aggregate?dataset=" + urlstring
      });
    };
    OSAPI.getTablePreview = function(options){
      //http://localhost:5000/api/slicer/cube/geometry/cubes_aggregate?cubes=test_geom|geom_test2&drilldown=geometry__country_level0
      var querystring = createAggQueryString(options); 
      return $http({
        method: 'JSON', 
        url: "/api/slicer/cube/geometry/cubes_aggregate" + querystring + "&pagesize=25"
      });
    };
    OSAPI.getFactsChoice = function(cubename, fieldname, fieldname_id){
      // need to figure out hierarchy choices here
      return $http({
        url: "/api/slicer/cube/" + cubename + "/aggregate?drilldown=" + fieldname_id
        //url: "/api/slicer/cube/" + cubename + "/facts?fields=" + fieldname_id + "&order=" + fieldname_id + ":asc"
      });
    };


    return OSAPI;
  })

/**
 * And of course we define a controller for our route.
 */
 .controller( 'CubesCrl', function CubesController( $scope, $location, OSAPIservice, sharedProperties, msgBus) {

//not the best place for this, but it is fine here
  $scope.cubes_options = [];

  if (sharedProperties.getCubes_options() == null ){

    OSAPIservice.getCubeModel("geometry").success(function (response) {
      //this needs to update the cached response
      var tempfields = getAllFields(response);
      sharedProperties.appendCube_op(response['name'], tempfields);
      sharedProperties.appendCube({'name':response['name'] , 'fields':['geometry__country_level0'], "drilldowns":[], 'cuts':{}});
    });

    OSAPIservice.getCubes().success(function (response) {
        //Dig into the responde to get the relevant data
        sharedProperties.setCubes_options(response);
        $scope.cubes_options = response;

    });
  }
  else{
    $scope.cubes_options = sharedProperties.getCubes_options();
  }

  $scope.setFilters = function(){
    $location.path('/drilldowns');
  };

})
.controller( 'SelectedOptions', function SelectedOptionsController( $scope, sharedProperties, msgBus) {


  $scope.cubes = sharedProperties.getCubes();

  $scope.removeDataset = function(cube_name){
    sharedProperties.deleteCube(cube_name);
    msgBus.emitMsg("tableUpdated");
  };
  $scope.removeField = function(cube_name, field){
    sharedProperties.removeCubeValue(cube_name, "fields", field);
    msgBus.emitMsg("tableUpdated");
  };
  $scope.removeDrilldown = function(cube_name, drilldown){
    sharedProperties.removeCubeValue(cube_name, "drilldowns", drilldown);
    msgBus.emitMsg("tableUpdated");
  };
  $scope.removeCut = function(cube_name, cutkey){
    sharedProperties.removeCubeCut(cube_name, cutkey);
    msgBus.emitMsg("tableUpdated");
  };

  msgBus.onMsg('optionsUpdated', $scope, function() {

    $scope.cubes = sharedProperties.getCubes();
  });

})
.controller( 'TablePreview', function TablePreviewController( $scope, OSAPIservice, sharedProperties, msgBus) {
  $scope.currentcall = null;
  $scope.hidetable = true;
  $scope.table_obj = null;
    msgBus.onMsg('tableUpdated', $scope, function() {
      //format the cubes_aggregate URL with options
      if ($scope.currentcall){
         return;
      }
      else{
        cubes_array = sharedProperties.getCubes();
        //check cache first
        var keylength = _.keys(cubes_array).length;
        if (keylength < 2){
          $scope.hidetable = true;
        }
        else{
          $scope.currentcall = OSAPIservice.getTablePreview(sharedProperties.getCubes()).success(function(response){
            msgBus.emitMsg("urlUpdated");
            var dtops;
            if (response.cells.length ===0){
              //$scope.table_obj = getTablefromDict(response.summary);
              dtops = getDataTableOptions([response.summary]); 
            }
            else{
              dtops = getDataTableOptions(response.cells); 
              //$scope.table_obj = getTablefromDict(response.cells);
            }
            if ($scope.table_obj){
              $scope.table_obj.destroy();
              $(".datatable-preview").empty();
            }
            $scope.table_obj = $(".datatable-preview").DataTable(dtops);
            $scope.currentcall = null;
            $scope.hidetable = false;
          });
        }
      }
      
    });
    $scope.updateTable = function(){
      msgBus.emitMsg("tableUpdated");
    };

})
.controller( 'CubeOptionsCtrl', function CubeOptionsController( $scope, $stateParams, $location, OSAPIservice, sharedProperties, msgBus) {
  $scope.loading = "Loading.....  This will be better eventually";
  $scope.model = {"cube_name":"", "description":"", "label":""};

  OSAPIservice.getCubeModel($stateParams.cubeId).success(function (response) {
    //this needs to update the cached response

    //might make this a link to dataset instead

    //$scope.theresponse = response;
    $scope.model['cube_name'] = response['name'];
    $scope.model['label'] = response['label'];
    $scope.model['description'] = response['description'];


    $scope.loading = "";
  });

  $scope.savedataset = function(){
    //sharedProperties.appendCube_op($scope.model.cube_name, {'fields':$scope.model['fieldoptions'], 'dimensions':$scope.model['dimensionsoptions']});
    sharedProperties.appendCube({'name':$scope.model.cube_name, 'fields': _.uniq($scope.model.selectedfields), "drilldowns":[], 'cuts':{}});
            msgBus.emitMsg('optionsUpdated');
        $location.path('/cubes');
  };    
  //stuff happens here

})
.controller( 'APIurlCrl', function APIurlController( $scope, sharedProperties, msgBus) {

  $scope.apiurl = null;
  msgBus.onMsg('urlUpdated', $scope, function() {
    //should just emit at the end of the URL processing function
    // maybe in the future
    var cubes = sharedProperties.getCubes();
    if (_.keys(cubes).length < 2){
      return;
    }
    else{
      $scope.apiurl = "/api/slicer/cube/geometry/cubes_aggregate" + createAggQueryString(sharedProperties.getCubes()) + "&format=csv"; 
    }
  });
})
.controller( 'DatamanagerCrl', function DatamanagerController( $scope, sharedProperties) {


});

