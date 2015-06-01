var modeler = angular.module( 'openspending.modeler', [
  'ui.router'
]);

modeler.config(function config( $stateProvider ) {
  $stateProvider.state('sourceform', {
    url: '/:datasetname/source',
    views: {
      "main": {
        //controller: 'CubeOptionsCtrl',
        templateUrl: 'templates/modeler.tpl.html'
      }
    }
  })
  //edit an existing indicator form
  .state('sourceform_edit', {
    url: '/:datasetname/source',
    views: {
      "main": {
        //controller: 'CubeOptionsCtrl',
        templateUrl: 'templates/modeler.tpl.html'
      }
    }
  });
});

modeler.controller( 'ModelerCtrl', function ModelerCtrl( $scope, $stateParams, $location, $http, $compile, validation) {

  //placeholder for options should be done in the Flask template
  $scope.reference = {"prefuncoptions" :[]};
  $scope.meta = {};

  //get the preprocessors from the references
  $http.get('/api/3/preprocessors')
    .then(function(res){
      $scope.reference.prefuncoptions = res.data; 
    });



  /*get the source information from the API*/

  $http.get('/api/3/datasets/' + $stateParams.datasetname + '/model')
    .then(function(res){

      if (res.data !== false && res.data != 'false'){
        $scope.meta = res.data;
        //populate the rest of the data if it exists
        $scope.sourceexists = true;
        $scope.metavalid = true;
        $scope.dataloaded = true;
        $(".model-columns").html(
          $compile(
            "<div class='modeler-choices' modeler-data></div>"
          )($scope)
        );


      }
      else{
        //we don't have a source yet
        $scope.sourceexists = false;
      }
    });
    //we are editing an existing one go get everything

  
    $(".save_buttons_loader").hide();
  $scope.save_meta = function() {
    $(".save_buttons_loader").show();

    var handleresponse = function(res) {
        //$location.path('/' + res.data.name + '/manage/meta');

        if (res){
          $scope.meta = res;
          //populate the rest of the data if it exists
          $scope.sourceexists = true;
          $scope.metavalid = true;
          $scope.dataloaded = true;
          $location.path("/" + $scope.meta.dataset + "/source");
          $(".model-columns").html(
            $compile(
              "<div class='modeler-choices' modeler-data></div>"
            )($scope)
          );
        }
        else{
          //error message
          console.log(res);
        }
        $(".save_buttons_loader").hide();
      };

    // form validation
    //check that there are actually values
    //name must be unique



    if ($('#sourcefile')[0].files.length == 1){

      //doesn't work in IE9 or less
       var form_data = new FormData();
       //only one file
       form_data.append("sourcefile", $('#sourcefile')[0].files[0]);
       form_data.append("name", $scope.meta.name);
       form_data.append("prefuncs", JSON.stringify($scope.meta.prefuncs));


        $.ajax({
            type: 'POST',
            url: '/api/3/datasets/' + $stateParams.datasetname + '/model',
            data: form_data,
            contentType: false,
            cache: false,
            processData: false,
            async: false,
            success: handleresponse
        });
    }
    else if ($scope.meta.url !== null){
        $.ajax({
            type: 'POST',
            url: '/api/3/datasets/' + $stateParams.datasetname + '/model',
            data: {'name': $scope.meta.name, 'url': $scope.meta.url, 'prefuncs': JSON.stringify($scope.meta.prefuncs)},
            cache: false,
            success: handleresponse
        });

    }
    else if ($scope.sourceexists){
      //this will update it all
        console.log($scope.meta.prefuncs);
        $.ajax({
            type: 'POST',
            url: '/api/3/datasets/' + $stateParams.datasetname + '/model',
            data: {'name': $scope.meta.name, 'prefuncs':JSON.stringify($scope.meta.prefuncs)},
            cache: false,
            success: handleresponse
        });
    }
    else{
      console.log("You must provide a URL or file");
    }


      //create a new one

    };



  $scope.apply_meta_default = function(){
      var dfd = $http.get('/api/3/datasets/' + $stateParams.datasetname + '/applymodel');
      dfd.then(function(res){
        if(res.data){
          $scope.meta = res.data;
          //populate the rest of the data if it exists
          $scope.sourceexists = true;
          $scope.metavalid = true;
          $scope.dataloaded = true;
          $location.path("/" + $scope.meta.dataset + "/source");
          $(".model-columns").html(
            $compile(
              "<div class='modeler-choices' modeler-data></div>"
            )($scope)
          );
        }
        else{
          console.log(res);
        }
      });

    //need to return meta and the other
  };

  $scope.loadsuccess = false;



});

// not really necessary
// could do an src include instead
modeler.directive('openRefine', function () {
        return {
          restrict: 'A',
          templateUrl: 'templates/openrefine.tpl.html'
          //transclude: true,
          // link: function postLink(scope, element, attrs) {

          // }
        };
      });

modeler.directive('openRefineFetch', function ($http) {
        return {
          restrict: 'A',
          template: '<button>Update Columns for Modeler</button>',
          //transclude: true,
          link: function postLink(scope, element, attrs) {
         
            // //taking the same scope as parent
            element.on("click", function () {
              if (scope.meta.ORURL){
                $http.get('/api/3/datasets/' + scope.meta.dataset + '/model/ORoperations')
                  .then(function(res){
                    if (res.data){
                      scope.meta.ORoperations = angular.toJson(res.data);
                      scope.updateModel();
                    }
                    else{
                      console.log("error in getting the openrefine");
                    }

                  });
              }
            });

          }
        };
      });



var globalness = null;


modeler.directive('modelerData', function ($http) {
        return {
          restrict: 'A',
          templateUrl: 'templates/dataModeler.tpl.html',
          //transclude: true,
          link: function postLink(scope, element, attrs) {
            if (!scope.meta){
              console.log("there was an error");
              return;
            }

            globalness = scope;

            scope.updateModel = function(){
                $http.get('/api/3/datasets/' + scope.meta.dataset + '/model/fields')
                .then(function(res){
                  if (res.data){
                    var tempcolumns = [];
                    jQuery.each(res.data.columns, function(i,columnval){
                      tempcolumns.push({"label":columnval, "code":columnval});
                    });
                    scope.reference.datacolumns = tempcolumns;

                    scope.modeler = res.data.modeler;
                  }
                  else{
                    console.log("error in getting the openrefine");
                  }

                });
            };
            scope.updateModel();
          }
        };
      });



var fielchecker = null;

modeler.directive('modelFieldChecker', function($http){
        return {
          restrict: 'A',
          template: '<button>Check me</button><div style="color:red">{{message}}</div>',
          scope: false,
          link: function postLink(scope, element, attrs) {
            scope.message = "";
            // wires are here for long polling
              fielchecker = scope;
              scope.columnkey = attrs['columname'];

              //scope.polling = false;
              // if (attrs['columnkey'] == "country_level0" || attrs['columnkey'] == "time"){

              //   //enter the checker
              // }
              // else{
              //   console.log("check is not used for these fields.. should hide them");
              // }
              element.on("click", function () {
                // var poller = function() {
                //   $http.get('/api/3/datasets/' + scope.$parent.meta.dataset + '/model/' + scope.$parent.meta.name + '/fieldcheck/' + scope.columnkey).then(function(res) {
                //     console.log(res);
                //     if (! scope.polling ){
                //       $timeout(poller, 2000);
                //     }
                //     //if something
                //   });      
                // };
                $http.post('/api/3/datasets/' + scope.$parent.meta.dataset + '/model/fieldcheck/' + scope.columnkey, 
                      {"columnval": scope.columnvalue.column})
                      .then(function(res) {
                        if (res.data.success){
                          scope.loadsuccess = true;
                          scope.message = "Everything looks good for this column";
                        }
                        else{
                          scope.message = res.data.message + res.data.errors;
                        }
                          //scope.polling = false;
                          //when this comes back turn off

                        });  
                //poller();

              });

          }
        };
});



modeler.directive('modelSubmit', function ($http) {
        return {
          restrict: 'A',
          template: '<div style="red">{{ submitmessage }}</div><button>Submit Model</button>',
          //transclude: true,
          link: function postLink(scope, element, attrs) {
            scope.submitmessage = "";
            scope.datarunning = false;
         
            // //taking the same scope as parent
            element.on("click", function () {
                scope.datarunning = true;

                //put post where it should be and it can pass off to celery
                //re


                // $("#completeform").submit(function(form){
                //     uuid = getUUID()
                //     $("#uuid").val(uuid);
                //     $("#statustext").html("Running Cleaning Operations");
                //     var myinterval = setInterval(function() {
                //         var myobj = {'uuid': uuid};
                //         var fails = 0
                //         $.ajax({
                //             type: 'GET',
                //             url: '/upload_status',
                //             data: myobj,
                //             cache: false,
                //             success: handleresponse,
                //             error: function(){
                //                 $("#statustext").html("Processing Complete.  A file should have downloaded.  You can now use a new file.");
                //                 $("[name=getdownload]").show();
                //                 clearInterval(myinterval);
                //             }
                //         });
                //     }, 5000); //5 seconds




                //validate that everything is there any ready to go with the column names
                $http.post('/api/3/datasets/' + scope.meta.dataset + '/runmodel', 
                      {"meta": scope.meta, "modeler": scope.modeler})
                      .then(function(res) {
                        if (res.data.success){
                          scope.submitmessage = "RUN Success";
                          scope.loadsuccess = true;
                        }
                        else{
                          scope.submitmessage = res.data.message + res.data.errors;
                        }
                        scope.datarunning = false;
                          //scope.polling = false;
                          //when this comes back turn off

                        });  

            });

          }
        };
      });


modeler.directive('modelOrgSubmit', function ($http) {
        return {
          restrict: 'A',
          template: '<div style="red">{{ orgmessage }}</div><button>Save as Default for Org</button>',
          //transclude: true,
          link: function postLink(scope, element, attrs) {
            scope.orgmessage = "";
         
            // //taking the same scope as parent
            element.on("click", function () {
              //validate that everything is there any ready to go with the column names
                $http.post('/api/3/datasets/' + scope.meta.dataset + '/applymodel', 
                      {"meta": scope.meta, "modeler": scope.modeler})
                      .then(function(res) {
                        if (res.data.success){
                          scope.orgmessage = "everything is ok";
                        }
                        else{
                          scope.orgmessage = res.data.message + res.data.errors;
                        }
                          //scope.polling = false;
                          //when this comes back turn off

                        });  

            });

          }
        };
      });
