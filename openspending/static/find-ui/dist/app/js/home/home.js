(function() {


    var model = {
        searchResults: ko.observableArray([]),

        searchValue: ko.observable(""),

        searchType: ko.observable("search-all"), //search-indicators, search-countries

        selectIndicator: function(obj) {
            window.location.href = "visualization#ind=" + obj.id
            // alert("selected indicator")
        }
    }

    ko.applyBindings(model);
    //search event
    $(".main-search").keyup(function() {

        var value = $(".main-search")[0].value;
        var url = "/api/3/search/indicators";
        model.searchValue(value);
        if (value.length < 2) {
            model.searchResults.removeAll();
            return;
        }

        $.ajax({
            url: url,
            jsonp: "callback",
            dataType: "jsonp",
            //dataType: "json",
            data: {
                q: value
            },
            success: function(response) {
                searchHandler(response, value)
            }
        });

    });

    $("input:radio[name=searchGroup]").change(function() {

        var value = $(this)[0].value;
        model.searchType(value);
    });


    var searchHandler = function(response, value) {

        //current search type
        var searchType = model.searchType();

        model.searchResults.removeAll();

        var valuesArr = value.split(" ");

        for (id in response.data) {
            var resultItem = {
                id: id,
                label: ""
            }
            var originalLabel = response.data[id];
            var label = originalLabel;

            _.forEach(valuesArr, function(v) {
                var regex = new RegExp('(' + v + ')', 'gi');

                label = label.replace(regex, "<strong style='color:red'>$1</strong>")
            })

            resultItem.label = label;


            model.searchResults.push(resultItem);
        }

    }




}())