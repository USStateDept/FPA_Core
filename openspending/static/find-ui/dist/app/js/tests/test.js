// test script related to issue #303
var TESTSERVER = {

  // mimic a normal visualizaiton --
  // send two json requests to server --
  // in prod 0, 1, or both may return a 500 error --
  // it may be possible that the server faults when trying
  // to handle multiple requests at once --
  test1: function() {

    // call 1
    $.ajax({
        url: "/api/slicer/cube/geometry/cubes_aggregate?&cluster=jenks&numclusters=4&cubes=number_of_people_affected_by_n&cut=geometry__time:1990-2015&order=time&drilldown=geometry__time",
        dataType: "json",
        data: {}
    }).done(function( data ) {
      console.log("call 1 success");
    }).fail(function( jqXHR, textStatus, errorThrown ) {
      console.log("call 1 failed");
    }).always(function( a, textStatus ){
      console.log("call 1 complete");
    });

    // call 2
    $.ajax({
        url: "/api/slicer/cube/geometry/cubes_aggregate?&cluster=jenks&numclusters=4&cubes=number_of_people_affected_by_n&cut=geometry__time:1990-2015&order=time&drilldown=geometry__country_level0@dos_region|geometry__time",
        dataType: "json",
        data: {}
    }).done(function( data ) {
      console.log("call 2 success");
    }).fail(function( jqXHR, textStatus, errorThrown ) {
      console.log("call 2 failed");
    }).always(function( a, textStatus ){
      console.log("call 2 complete");
    });

  },

  // double the normal visualizaiton --
  // send four json requests to server --
  test2: function() {

    // call 1
    $.ajax({
        url: "/api/slicer/cube/geometry/cubes_aggregate?&cluster=jenks&numclusters=4&cubes=number_of_people_affected_by_n&cut=geometry__time:1990-2015&order=time&drilldown=geometry__time",
        dataType: "json",
        data: {}
    }).done(function( data ) {
      console.log("call 1.1 success");
    }).fail(function( jqXHR, textStatus, errorThrown ) {
      console.log("call 1.1 failed");
    }).always(function( a, textStatus ){
      console.log("call 1.1 complete");
    });

    // call 2
    $.ajax({
        url: "/api/slicer/cube/geometry/cubes_aggregate?&cluster=jenks&numclusters=4&cubes=number_of_people_affected_by_n&cut=geometry__time:1990-2015&order=time&drilldown=geometry__country_level0@dos_region|geometry__time",
        dataType: "json",
        data: {}
    }).done(function( data ) {
      console.log("call 1.2 success");
    }).fail(function( jqXHR, textStatus, errorThrown ) {
      console.log("call 1.2 failed");
    }).always(function( a, textStatus ){
      console.log("call 1.2 complete");
    });

    // call 3
    $.ajax({
        url: "/api/slicer/cube/geometry/cubes_aggregate?&cluster=jenks&numclusters=4&cubes=criminalization_of_the_state&cut=geometry__time:1990-2015&order=time&drilldown=geometry__country_level0@dos_region|geometry__time",
        dataType: "json",
        data: {}
    }).done(function( data ) {
      console.log("call 2.1 success");
    }).fail(function( jqXHR, textStatus, errorThrown ) {
      console.log("call 2.1 failed");
    }).always(function( a, textStatus ){
      console.log("call 2.1 complete");
    });

    // call 4
    $.ajax({
        url: "/api/slicer/cube/geometry/cubes_aggregate?&cluster=jenks&numclusters=4&cubes=criminalization_of_the_state&cut=geometry__time:1990-2015&order=time&drilldown=geometry__time",
        dataType: "json",
        data: {}
    }).done(function( data ) {
      console.log("call 2.2 success");
    }).fail(function( jqXHR, textStatus, errorThrown ) {
      console.log("call 2.2 failed");
    }).always(function( a, textStatus ){
      console.log("call 2.2 complete");
    });

  },

  // peform test 1 in callback form
  test3: function() {

    // call 1
    $.ajax({
        url: "/api/slicer/cube/geometry/cubes_aggregate?&cluster=jenks&numclusters=4&cubes=number_of_people_affected_by_n&cut=geometry__time:1990-2015&order=time&drilldown=geometry__time",
        dataType: "json",
        data: {}
    }).done(function( data ) {
      console.log("call 1 success");
    }).fail(function( jqXHR, textStatus, errorThrown ) {
      console.log("call 1 failed");
    }).always(function( a, textStatus ){
      console.log("call 1 complete");
    }).then(function() {
      // call 2
      $.ajax({
          url: "/api/slicer/cube/geometry/cubes_aggregate?&cluster=jenks&numclusters=4&cubes=number_of_people_affected_by_n&cut=geometry__time:1990-2015&order=time&drilldown=geometry__country_level0@dos_region|geometry__time",
          dataType: "json",
          data: {}
      }).done(function( data ) {
        console.log("call 2 success");
      }).fail(function( jqXHR, textStatus, errorThrown ) {
        console.log("call 2 failed");
      }).always(function( a, textStatus ){
        console.log("call 2 complete");
      });
    })






  }


};
