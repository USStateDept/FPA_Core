
var openspending = angular.module('openspending', ['templates-app','templates-common', 'ngCookies', 'ui.router', 'ui.bootstrap', 'localytics.directives', 'openspending.modeler']);


openspending.controller('AppCtrl', ['$scope', '$location', '$http', '$cookies', '$window', '$sce', 'flash',
  function($scope, $location, $http, $cookies, $window, $sce, flash) {
  
  $scope.flash = flash;


  // Allow SCE escaping in the app
  $scope.trustAsHtml = function(text) {
    return $sce.trustAsHtml('' + text);
  };

}]);


openspending.factory('flash', ['$rootScope', function($rootScope) {
  // Message flashing.
  var currentMessage = null;

  $rootScope.$on("$routeChangeSuccess", function() {
    currentMessage = null;
  });

  return {
    setMessage: function(message, type) {
      currentMessage = [message, type];
    },
    getMessage: function() {
      return currentMessage;
    }
  };
}]);


openspending.factory('OSAPIservice', function($http) {

    var OSAPI = {};


    OSAPI.getDatasets = function(dataset_params) {
      //options include
      //fields=field1,feidl2, and getsources=true
      return $http({ 
        url: '/api/3/datasets',
        params: dataset_params
      });
    };
    return OSAPI;
  });

openspending.factory('validation', ['flash', function(flash) {
  // handle server-side form validation errors.
  return {
    handle: handle = function(form) {
      return function(res) {
        if (res.status == 400 || !form) {
            var errors = [];
            for (var field in res.data.errors) {
                form[field].$setValidity('value', false);
                form[field].$message = res.data.errors[field];
                errors.push(field);
            }
            if (angular.isDefined(form._errors)) {
                angular.forEach(form._errors, function(field) {
                    if (errors.indexOf(field) == -1) {
                        form[field].$setValidity('value', true);
                    }
                });
            }
            form._errors = errors;
        } else {
          console.log(res);
          flash.setMessage(res.data.message || res.data.title || 'Server error', 'danger');
        }
      };
    }
  };
}]);


openspending.factory('referenceData', ['$http', function($http) {
  /* This is used to cache reference data once it has been retrieved from the 
  server. Reference data includes the canonical lists of country names,
  currencies, etc. */
  var referenceData = $http.get('/api/3/reference');

  var getData = function(cb) {
    referenceData.then(function(res) {
      cb(res.data);
    });
  };

  return {'get': getData};
}]);




openspending.controller('DatasetNewCtrl', ['$scope', '$http', '$window', '$location', '$stateParams', 'referenceData', 'validation',
  function($scope, $http, $window, $location, $stateParams, referenceData, validation) {
  /* This controller is not activated via routing, but explicitly through the 
  dataset.new flask route. */
  
  $scope.reference = {};
  $scope.permissions = {"create":false};
  $scope.dataset = {};
  $scope.errors = [];

  referenceData.get(function(reference) {
    $scope.reference = reference;
  });

  var saveExistingDataSet = function(form) {
                          //validate this for the dataorg can be set later anyway?
                          postdata = {};
                          $.extend(postdata, $scope.dataset, {'csrf_token': csrf_token});
                          var dfd = $http.post('/api/3/datasets/' + $stateParams.datasetname, postdata);
                          dfd.then(function(res) {
                            //$location.path('/' + res.data.name + '/manage/meta');
                            if (res.data.success === true){
                              //flash message
                              $location.path('/datasetlist');
                            }
                            else{
                              $scope.errors = res.data.errors;
                              // maybe set error here
                              //error message
                            }
                          }, validation.handle(form));
                        };

  var saveNewDataSet = function(form) {
                        postdata = {};
                        $.extend(postdata, $scope.dataset, {'csrf_token': csrf_token});
                        var dfd = $http.post('/api/3/datasets', postdata);
                        dfd.then(function(res) {
                            if (res.data.success === true){
                              //flash message
                              $location.path('/datasetlist');
                            }
                            else{
                              $scope.errors = res.data.errors;
                              // maybe set error here
                              //error message
                            }

                          //$location.path('/' + res.data.name + '/manage/meta');

                        }, validation.handle(form));
                      };



  if ($stateParams.datasetname){
    //get dataset info and update the scope
    //checks permission as well
    $http.get('/api/3/datasets/' + $stateParams.datasetname)
      .then(function(res){

        //error handling

        $scope.dataset = res.data;
        //need to add in error catch here
        $scope.permissions.create = true;


        $scope.save = saveExistingDataSet;

      });

  }
  else{
    $http.get('/api/3/permissions?dataset=new').then(function(res) {
      $scope.permissions = res.data;
    });
    $scope.save = saveNewDataSet;
  }

}]);

openspending.controller('SourceFormCtrl', ['$scope', '$http', '$window', '$location', '$stateParams', 'referenceData', 'validation',
  function($scope, $http, $window, $location, $stateParams, referenceData, validation) {
    // if $stateProvider.sourcename then populate with data
    // muse have $stateProvider.dataset as dataset name

    $scope.permissions = {"create" : false};
    $scope.reference = {'frequpdate' : [
        {'code': 'never', 'label': 'Never'},
        {'code': 'daily', 'label': 'Daily'},
        {'code': 'weekly', 'label': 'Weekly'},
        {'code': 'monthly', 'label': 'Monthly'}
        ]
      };

    $scope.source = {"label":null, "url": null, "frequpdate":null};

    if (! $stateParams.sourcename){
      //check that user has permission
      $http.get('/api/3/permissions?dataset=new').then(function(res) {
        $scope.permissions = res.data;
      }); 
    }
    else{
      //populate the form with a call
    }



  $scope.save = function(form) {
    postdata = {};
    $.extend(postdata, $scope.dataset, {'csrf_token': csrf_token});
    var dfd = $http.post('/api/3/datasets', postdata);
    dfd.then(function(res) {
      $location.path('/' + res.data.name + '/manage/meta');
    }, validation.handle(form));
  };

// can check this as we


}]);



var getDataTableOptions = function(resobj){


  var basekeys = _.keys(resobj[0]);
  var headers = [{data:"loaddata", title:"load link"}];
  _.each(basekeys, function(val, key){
    //backslash per https://datatables.net/reference/option/columns.render
	if(val!='description'&&val!='name'&&val!='source'){
		headers.push({data:val.replace('.', '\\.'), title:val.replace('.', '\\.')});
	}
  });


  _.each(resobj, function(val, key){
    val['loaddata'] = '<a class="list-group-item" href="#/' + val['name'] + '/source" target="_blank"> **Edit Data***</a>';
	
	if(val['has_data']===true){
		val['has_data'] = '<a href="/api/slicer/cube/geometry/cubes_aggregate?cubes=' + val['name'] + '&drilldown=geometry__country_level0@name" target="_blank">'+val['has_data']+'</a>';
    }
  });

  return {data: resobj,
          columns: headers,
          destroy: true};
};



openspending.controller('datasetListCrl', ['$scope', '$http', 'OSAPIservice', '$location', 
  function($scope, $http, OSAPIservice, $location) {

    $scope.table_loading= "Loading....";

    $scope.datasets = [];
    OSAPIservice.getDatasets({'fields':"name,label"})
    .success(function (response) {
      $scope.datasets = response;

      var dtops = getDataTableOptions(response); 
      //$scope.table_obj = getTablefromDict(response.cells);
      
      if ($scope.table_obj){
        $scope.table_obj.destroy();
        $(".datatable-preview").empty();
      }
      $scope.table_obj = $(".datatable-preview").DataTable(dtops);
      $scope.table_loading = null;
    });

    $scope.deleteSource = function(datasetname, sourcename){
      //delete is a reserved word
      var req = {
       method: 'DELETE',
       url: '/api/3/datasets/' + datasetname + '/sources/' + sourcename
      };

      $http(req)
      .then(function(res){
        if (res.data){
          $scope.datasets = res.data;
        }
        //remove it from the set or rerun dataListCrl
      });

    };

    $scope.newDatasource = function(){
      $location.path("dataform");
    };

}]);




openspending.config( function myAppConfig ( $stateProvider, $urlRouterProvider ) {
  $urlRouterProvider.otherwise( '/datasetlist' );
});

openspending.config(function OSStateProvider( $stateProvider ) {
  $stateProvider.state('datasetlist', {
    url: '/datasetlist',
    views: {
      "main": {
        controller: 'datasetListCrl',
        templateUrl: 'templates/dataset-list.tpl.html'
      }
    }
  })
  //create a new dataset  
  .state('dataform', {
    url: '/dataform',
    views: {
      "main": {
        //controller: 'CubeOptionsCtrl',
        templateUrl: 'templates/data_form.tpl.html'
      }
    }
  })
  //manage an existing dataset
  .state('dataform_edit', {
    url: '/:datasetname/manage',
    views: {
      "main": {
        //controller: 'DatamanagerCrl',
        templateUrl: 'templates/data_form.tpl.html'
      }
    }
  });

});

