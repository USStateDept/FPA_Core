/**
 * Tests sit right alongside the file they are testing, which is more intuitive
 * and portable than separating `src` and `test` directories. Additionally, the
 * build process will exclude all `.spec.js` files from the build
 * automatically.
 */
describe( 'filter loadedn', function() {
  beforeEach( module( 'databankjs.filter' ) );

  it( 'should pass dumy test', inject( function() {
    expect( true ).toBeTruthy();
  }));
});
