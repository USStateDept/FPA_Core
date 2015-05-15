/**
 * Tests sit right alongside the file they are testing, which is more intuitive
 * and portable than separating `src` and `test` directories. Additionally, the
 * build process will exclude all `.spec.js` files from the build
 * automatically.
 */
describe( 'home section', function() {
  beforeEach( module( 'databankjs.datamanager' ) );

  it( 'should have a dummy test', inject( function() {
    expect( true ).toBeTruthy();
  }));
});


describe( ' datamanager contorller', function(){

    var sharedProperties, $scope;


    beforeEach( module( 'databankjs' ) );



    beforeEach(inject(function($injector, _sharedProperties_, $rootScope){
      $scope = $rootScope.$new();
      sharedProperties = _sharedProperties_;
      // $httpBackend = $injector.get('$httpBackend');


      // OSAPIservice = $httpBackend.when('GET', '/api/slicer/cubes')
      //                               .response([{"name": "geometry", "label": "geometry"}, {"name": "test_geom", "label": "test_geom"}]);



      sharedProperties.setCubes_options([{"name": "geometry", "label": "geometry"}, {"name": "test_geom", "label": "test_geom"}]);

      var response = {"name": "test_geom", "info": {}, "label": "test_geom", "description": "test_geom", "aggregates": [{"name": "num_entries", "info": {}, "label": "Numer of entries", "ref": "num_entries", "function": "count"}, {"name": "amount", "info": {}, "label": "Amount", "ref": "amount", "function": "sum", "measure": "amount"}], "measures": [{"name": "amount", "info": {}, "label": "Amount", "ref": "amount"}], "details": [], "dimensions": [{"name": "country_level0", "info": {}, "label": "Country_level0", "default_hierarchy_name": "default", "levels": [{"name": "country_level0", "info": {}, "label": "Country_level0", "key": "name", "label_attribute": "name", "order_attribute": "id", "attributes": [{"name": "id", "info": {}, "ref": "country_level0.id", "locales": []}, {"name": "name", "info": {}, "ref": "country_level0.name", "locales": []}, {"name": "label", "info": {}, "ref": "country_level0.label", "locales": []}]}], "hierarchies": [{"name": "default", "info": {}, "levels": ["country_level0"]}], "is_flat": true, "has_details": true}, {"name": "time", "info": {}, "label": "Time", "default_hierarchy_name": "weekly", "role": "time", "levels": [{"name": "year", "info": {}, "label": "Year", "role": "year", "key": "year", "label_attribute": "year", "order_attribute": "year", "attributes": [{"name": "year", "info": {}, "label": "Year", "ref": "time.year", "locales": []}]}, {"name": "quarter", "info": {}, "label": "Quarter", "role": "quarter", "key": "quarter", "label_attribute": "quarter", "order_attribute": "quarter", "attributes": [{"name": "quarter", "info": {}, "label": "Quarter", "ref": "time.quarter", "locales": []}]}, {"name": "month", "info": {}, "label": "Month", "role": "month", "key": "month", "label_attribute": "month", "order_attribute": "month", "attributes": [{"name": "month", "info": {}, "label": "Month", "ref": "time.month", "locales": []}]}, {"name": "week", "info": {}, "label": "Week", "role": "week", "key": "week", "label_attribute": "week", "order_attribute": "week", "attributes": [{"name": "week", "info": {}, "label": "Week", "ref": "time.week", "locales": []}]}, {"name": "day", "info": {}, "label": "Day", "role": "day", "key": "name", "label_attribute": "name", "order_attribute": "day", "attributes": [{"name": "day", "info": {}, "ref": "time.day", "locales": []}, {"name": "name", "info": {}, "ref": "time.name", "locales": []}]}], "hierarchies": [{"name": "weekly", "info": {}, "label": "Weekly", "levels": ["year", "week"]}, {"name": "daily", "info": {}, "label": "Daily", "levels": ["year", "month", "day"]}, {"name": "monthly", "info": {}, "label": "Monthly", "levels": ["year", "quarter", "month"]}], "is_flat": false, "has_details": true}, {"name": "theid", "info": {}, "label": "Theid", "default_hierarchy_name": "default", "levels": [{"name": "theid", "info": {}, "label": "Theid", "key": "theid", "label_attribute": "theid", "order_attribute": "theid", "attributes": [{"name": "theid", "info": {}, "ref": "theid", "locales": []}]}], "hierarchies": [{"name": "default", "info": {}, "levels": ["theid"]}], "is_flat": true, "has_details": false}], "features": {"post_aggregate_functions": ["smvar", "sms", "smrsd", "wma", "smstd", "sma"], "aggregate_functions": ["count", "min", "max", "sum", "custom", "count_nonempty", "stddev", "variance", "avg", "count_distinct"], "actions": ["aggregate", "fact", "members", "facts", "cell"]}};


      var returnset = getAllFields(response);



      sharedProperties.appendCube_op(response['cube_name'], {'fields':returnset['fields'], 'dimensions':returnset['dimensions']});
      sharedProperties.appendCube({'name':response['cube_name'], 'fields': returnset['fields'], "dimensions":[]});


    }));


    describe(" checking the cubes contorller ", function(){
        var cubesctrl;
          beforeEach(inject(function($controller) {
            // Create a new scope that's a child of the $rootScope
            // Create the controller
            cubesctrl = $controller('CubesCrl', {
              $scope:  $scope
            });
          }));

          it('should have stuff in the scope options', 
            function() {
              expect($scope.cubes_options).toBeTruthy();
          });
    });

    






});
