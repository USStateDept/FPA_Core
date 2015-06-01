describe( 'AppCtrl', function() {
  describe( 'isCurrentUrl', function() {
    var AppCtrl, $location, $scope;

    beforeEach( module( 'databankjs' ) );

    beforeEach( inject( function( $controller, _$location_, $rootScope ) {
      $location = _$location_;
      $scope = $rootScope.$new();
      AppCtrl = $controller( 'AppCtrl', { $location: $location, $scope: $scope });
    }));

    it( 'should pass a dummy test', inject( function() {
      expect( AppCtrl ).toBeTruthy();
    }));
  });



  describe('shared Properties', function(){
    var sharedProperties, $scope;

    beforeEach( module( 'databankjs' ) );

    beforeEach(inject(function(_sharedProperties_, $rootScope){
      $scope = $rootScope.$new();
      sharedProperties = _sharedProperties_;
      sharedProperties.appendCube({'name':"foo", 
          'drilldowns':[], 
          "fields":[{"name":"something", "value":"something"}]});
    }));

    it("should provide a proper cube model", function(){
      var mycubes = sharedProperties.getCubes();
      expect(mycubes['foo'].name).toEqual('foo');
    });

    it(" should delete an append cube", function(){
      sharedProperties.appendCube({'name':'foo2', 'drilldowns':[], "fields":[{'name':"something2", "value":"something2"}]});
      sharedProperties.deleteCube("foo2");
      var mycubes = sharedProperties.getCubes();
      expect (mycubes['foo2']).toEqual(undefined);
    });






////GOOD SERVICE HERE




    // it(" should be able to set dimensions and print dimensions ", function(){
    //   sharedProperties.setCubeValue("foo", "dimensions", [{"name":"something", "value":"something"}]);
    //   console.log(sharedProperties.getDimensionsOptions());
    //   expect(sharedProperties.getDimensionsOptions().length).toEqual(1);
    // });


          

      //     sharedProperties.appendCube({'name':"foo2", 
      //     'dimensions':[], 
      //     "fields":[{"name":"something2", "value":"something2"}]});

      // sharedProperties.appendCube({'name':"deleteme", 
      //     'dimensions':[], 
      //     "fields":[{"name":"deleteme", "value":"deleteme"}]});

      // sharedProperties.deleteCube("deleteme");




  });

});
