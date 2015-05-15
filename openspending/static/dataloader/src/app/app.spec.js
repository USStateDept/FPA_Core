describe( 'AppCtrl', function() {
  describe( 'isCurrentUrl', function() {
    var AppCtrl, $location, $scope;

    beforeEach( module( 'openspending' ) );

    beforeEach( inject( function( $controller, _$location_, $rootScope ) {
      $location = _$location_;
      $scope = $rootScope.$new();
      AppCtrl = $controller( 'AppCtrl', { $location: $location, $scope: $scope });
    }));

    it( 'should pass a dummy test', inject( function() {
      expect( AppCtrl ).toBeTruthy();
    }));
  });
});


describe('flasher', function() {

  beforeEach(module('openspending'));

  var rootscope;
  var flash;

  beforeEach(inject(function(_$rootScope_, _flash_) {
    rootscope = _$rootScope_;
    flash = _flash_;
  }));

  describe('when we need to flash', function() {

    beforeEach(function() {

      flash.setMessage('fooness', 'footype');
    });

    it('should be happy', function() {
      expect(flash.getMessage()[0]).toEqual('fooness');
    });
  });
});

