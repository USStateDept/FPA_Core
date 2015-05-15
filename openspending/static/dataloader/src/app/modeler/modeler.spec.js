describe( 'AppCtrl', function() {
  describe( 'isCurrentUrl', function() {
    var AppCtrl, $location, $scope;

    beforeEach( module( 'openspending.modeler' ) );

    it( 'should have a dummy test', inject( function() {
      expect( true ).toBeTruthy();
    }));
  });
});

// describe('flasher', function() {

//   beforeEach(module('openspending'));

//   var rootscope;
//   var flash;

//   beforeEach(inject(function(_$rootScope_, _flash_) {
//     rootscope = _$rootScope_;
//     flash = _flash_;
//   }));

//   describe('when we need to flash', function() {

//     beforeEach(function() {

//       flash.setMessage('fooness', 'footype');
//     });

//     it('should be happy', function() {
//       expect(flash.getMessage()[0]).toEqual('fooness');
//     });
//   });
// });


