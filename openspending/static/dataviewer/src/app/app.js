angular.module( 'databankjs', [
  'templates-app',
  'templates-common',
  'databankjs.datamanager',
  'databankjs.filter',
  //'databankjs.fieldcalculator',
  //'databankjs.downloader',
  'ui.router'
])

.config( function myAppConfig ( $stateProvider, $urlRouterProvider ) {
  $urlRouterProvider.otherwise( '/cubes' );
})
.factory('msgBus', ['$rootScope', function($rootScope) {
        var msgBus = {};
        msgBus.emitMsg = function(msg) {
          $rootScope.$emit(msg);
        };
        msgBus.onMsg = function(msg, scope, func) {
            var unbind = $rootScope.$on(msg, func);
            scope.$on('$destroy', unbind);
        };
        return msgBus;
    }])
.factory('sharedProperties', function () {
        //hold the names of the cubes as options
        var cubes_options = null;

        // this holds the cube options in a cache to include the following
        // key cubename => {dimensions, fields}
        //only selected cubes will live in this cache they are to be removed when they are deleted from selection
        var cubes_opscache = {};

        //this will store the cached value of the tables
        var table_chunks = null;

        //this will be the selected options from the cubes_options
        //key cubename => options include {"cuts", "fields", "drilldowns"}
        var cubes = {};

        return {
            getCube_op : function(keyname, cubename){
              //key name could be dimensions or fields

              //no cube name means get all options of the keyname
              if (! cubename){ 
                var returnval = [];
                _.each(cubes_opscache, function(value, key){

                });

              }
              return cubes_opscache[keyname];
            },
            setCube_op : function(cubename, keyname, theval){
              if (_.has(cubes_opscache, cubename)){
                cubes_opscache[cubename][keyname] = theval;
              }
              else{
                cubes_opscache[cubename] = {keyname:theval};
              }
            },
            appendCube_op: function (cubename, value){
              cubes_opscache[cubename] = value;
            },
            getCubes_options: function () {
                return cubes_options;
            },
            setCubes_options: function(value) {
                cubes_options = value;
            },
            getDimensionsOptions: function() {
              var field_options = [];
              _.each(cubes_opscache, function(value, key){
                field_options = _.union(field_options, value['dimensions']);
              });
              return field_options;
            },
            getHierarchiesDimension: function(dimname){
              var cubename = dimname.split("__")[0];
              var returnvalue = null;
              _.each(cubes_opscache[cubename]['dimensions'], function(value, key){
                if (value['value'] == dimname){
                  returnvalue =  value.hierarchies;
                }
              });
              return returnvalue;
              
            },
            getTable_chunks: function () {
                return table_chunks;
            },
            setTable_chunks: function(value) {
                table_chunks = value;
            },
            getCubes: function () {
                return cubes;
            },
            deleteCube: function(cubeid){
              delete cubes[cubeid];
              delete cubes_opscache[cubeid];
            },
            appendCube: function(value) {
              cubes[value.name] = value;
            },
            setCubeValue: function(cubename, valuename, theval){
              console.log(theval);
              cubes[cubename][valuename] = theval;
            },
            appendCubeValue: function(cubename, valuename, theval){
              cubes[cubename][valuename].push(theval);
            },
            removeCubeValue: function(cubename, valuename, theval){
              // this only works for the arrays of fields and drilldowns
              // cuts will have its own function
              cubes[cubename][valuename] = _.without(cubes[cubename][valuename], theval); 
            },
            removeCubeCut: function(cubename, cutkey){
              delete cubes[cubename]["cuts"][cutkey];
            },
            appendCubeCut: function(cubename, fieldname, values){
              var tempcubename = fieldname.split("__")[0];
              cubes[tempcubename]['cuts'][fieldname] = values;
            },
            getAllFields: function(){
              var field_options = [];
              _.each(cubes_opscache, function(value, key){
                field_options = _.union(field_options, value['fields']);
              });
              console.log(field_options);
              return field_options;
            },
            getField: function(fieldname){
              var cubename = fieldname.split("__")[0];
              var returnvalue = false;
              _.each(cubes_opscache[cubename]['fields'], function(value, key){
                if (value.value == fieldname){
                  returnvalue = value;
                  return false;
                }
              });
              return returnvalue;
            }
        };
    })
/*
.run( function run () {
})
*/
.controller( 'AppCtrl', function AppCtrl ( $scope, $location ) {

  $scope.$on('$stateChangeSuccess', function(event, toState, toParams, fromState, fromParams){
    if ( angular.isDefined( toState.data.pageTitle ) ) {
      $scope.pageTitle = toState.data.pageTitle + ' | Data Manager' ;
    }
  });
  

})// allow DI for use in controllers, unit tests
.constant('_', window._)
// use in views, ng-repeat="x in _.range(3)"
.run(function ($rootScope) {
   $rootScope._ = window._;
});

