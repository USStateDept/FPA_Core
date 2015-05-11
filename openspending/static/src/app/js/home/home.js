(function() {


    var model = {
        searchResults: ko.observableArray([]),

        searchValue: ko.observable(""),

        selectIndicator: function(obj) {
            window.location.href = "visualization#ind=" + obj.id
            // alert("selected indicator")
        }
    }

    ko.applyBindings(model);
    //search event
    $(".main-search").keyup(function() {

        var value = $(".main-search")[0].value;
        var url = "http://finddev.edip-maps.net/api/3/search";
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

    var searchHandler = function(response, value) {

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