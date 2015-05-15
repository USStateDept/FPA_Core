



var datafilter = angular.module( 'databankjs.filter', [
  'ui.router'
])
.config(function config( $stateProvider ) {
  $stateProvider
  .state('drilldowns', {
    url: '/drilldowns',
    views: {
      "main": {
        controller: 'drilldownCrl',
        templateUrl: 'filter/drilldowns.tpl.html'
      }
    },
    data:{ pageTitle: 'Drill Downs' }
  })  
  .state('simplefilter', {
    url: '/simplefilter',
    views: {
      "main": {
        controller: 'simpefilterCrl',
        templateUrl: 'filter/simplefilter.tpl.html'
      }
    },
    data:{ pageTitle: 'Simple Filter' }
  }).state('simplefilteritem', {
    url: '/simplefilter/:field_name',
    views: {
      "main": {
        controller: 'simpefilteritemCrl',
        templateUrl: 'filter/simplefilteritem.tpl.html'
      }
    },
    data:{ pageTitle: 'Simple Filter Item' }
  });
})
.controller( 'drilldownCrl', function DrilldownsController( $scope, sharedProperties, msgBus) {
  msgBus.emitMsg("tableUpdated");
  $scope.dimensionoptions = sharedProperties.getDimensionsOptions();
  $scope.hieroptions = [];

  $scope.selecteddrilldowns = null;
  $scope.selectedhier = null;


  $scope.changeDrilldown = function(){
    //get all available hierarchies and display in the options list
    var tempops = null;
    _.each($scope.dimensionoptions, function(dim, key){
      if (dim['value'] == $scope.selecteddrilldowns){
        tempops = dim;
        return false;
      }
    });

    if (! _.has(tempops, "hierarchies")){
      //add not about no hier options... please move along
      $scope.hieroptions = [];
      return;
    }
    else if (tempops['hierarchies'].length < 2){
      //again move along there's nothing to see here
      $scope.hieroptions = [];
      return;
    }
    else{
      var temphierops = [];
      _.each(tempops['hierarchies'], function(hier, key){
        _.extend(hier, {'value':hier['name']});
        temphierops.push(hier);
      });
      $scope.hieroptions = temphierops;
    }

  };

  $scope.addDrilldown = function(){
    //probably should split into object later
    var tempdrilldownstr = "";
    if (! $scope.selecteddrilldowns){
      console.log("flash and error message here to validate the form");
      return;
    }
    var tempcubename = $scope.selecteddrilldowns.split("__")[0];
    console.log($scope.selectedhier);
    if ($scope.selectedhier !== null){
      sharedProperties.appendCubeValue(tempcubename, "drilldowns", $scope.selecteddrilldowns + "@" + $scope.selectedhier);
    }
    else{
      sharedProperties.appendCubeValue(tempcubename, "drilldowns", $scope.selecteddrilldowns);
    }
    $scope.selecteddrilldowns = null;
    $scope.selectedhier = null;
    
    msgBus.emitMsg("optionsUpdated");
    msgBus.emitMsg("tableUpdated");


    // var tempobj = {};
    // _.each($scope.selecteddrilldowns, function(fieldname, index){
    //   var tempname = getCubeName(fieldname);
    //   if(_.has(tempobj, tempname)){
    //     tempobj[tempname].push(fieldname);
    //   }
    //   else{
    //     tempobj[tempname] = [fieldname];
    //   }
    // });

    // //var tempname = getCubeName($scope.selecteddrilldowns);
    // _.each(tempobj, function(drilldowns, cubename){
    //   sharedProperties.setCubeValue(cubename, "drilldowns", drilldowns);
    // });
    

    // msgBus.emitMsg("tableUpdated");

  };
  //get all field names from sharedProperties
  //add available operators
  //list current saved in repeat

})
.controller( 'simpefilterCrl', function SimpleFilterController( $scope, sharedProperties, msgBus) {
   $scope.fieldops = sharedProperties.getAllFields();
 


})
.controller( 'simpefilteritemCrl', function SimpleFilterItemController( $scope, $stateParams, $location, sharedProperties, msgBus, OSAPIservice) {
  //show informaiton about this item

  $scope.fieldsettings = sharedProperties.getField($stateParams.field_name);
  $scope.selectedcuts = {};
  $scope.valoptions = [];
  $scope.operator = null;

//types include value, range, and list
  $scope.formtype = "value";

  console.log($scope.fieldsettings);
  if ($scope.fieldsettings.role == "measures" || $scope.fieldsettings.role == "aggregates"){
    //render a range value 
    //not sure cubes can hanble cuts or filters on 
  }
  else{
    var tempsplitname = $scope.fieldsettings.value.split("__");
    //maybe not so hacky in the future
    $scope.fielditem = tempsplitname[1] + ".name";
    if (tempsplitname[1] == "time"){
      $scope.fielditem = tempsplitname[1] + ".year";
    }
    OSAPIservice.getFactsChoice(tempsplitname[0], tempsplitname[1], $scope.fielditem).success(function (response) {
        //Dig into the responde to get the relevant data
        $scope.fieldoptions = {};

        _.each(response['cells'], function(value, key){
            $scope.fieldoptions[value[$scope.fielditem]] = {'label':value[$scope.fielditem], 'name':value[$scope.fielditem]};
        });

    });
    //potnetially a slider here
    //provide select of all values
  }
  $scope.onAddCut = function(){
    //need to verify that there are values in fieldops
    sharedProperties.appendCubeCut($scope.fieldsettings.value.split("__")[0], $scope.fieldsettings.value, $scope.valoptions);
    msgBus.emitMsg('tableUpdated');
    $location.path('/simplefilter');

  };

});