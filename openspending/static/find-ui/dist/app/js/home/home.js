(function() {


    var model = {
        searchResults: ko.observableArray([]),

        searchValue: ko.observable(""),

        searchType: ko.observable("all"), //indicators, countries

        selectIndicator: function(obj) {

            if (obj.type == "countries") {

                window.location.href = "data-visualization#y=1990|2014&f=1990|2014&i=gdp_per_capita&l=GDP+Per+Capita&c=line&g=all&r=&cn=" + obj.id

            }


            if (obj.type == "indicators") {

                window.location.href = "data-visualization#y=1990|2014&f=1990|2014&i=" + obj.id + "&l=" + obj.label + "&c=line&g=all&r=&cn=";

            }
            // alert("selected indicator")
        }
    }

    ko.applyBindings(model);

    var searchKeyUpHandler = function() {

            var value = $(".main-search")[0].value;

            var url = "/api/3/search/countries";

            switch (model.searchType()) {

                case "countries":
                    url = "/api/3/search/countries";
                    break;

                case "indicators":
                    url = "/api/3/search/indicators";
                    break;

                default:
                    url = "/api/3/search";
                    break;
            }

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

        }
        //search event
    $(".main-search").keyup(searchKeyUpHandler);

    $("input:radio[name=searchGroup]").change(function() {

        var value = $(this)[0].value;

        model.searchResults.removeAll();
        model.searchType(value);
        searchKeyUpHandler();

    });


    var searchHandler = function(response, value) {

        //current search type
        var searchType = model.searchType();

        model.searchResults.removeAll();

        var searchLevel = ["countries", "indicators"];

        if (searchType != "all") {
            searchLevel = [searchType];
        }

        var valuesArr = value.split(" ");

        _.forEach(searchLevel, function(responseType) {

            for (id in response.data[responseType]) {

                var resultItem = {
                    id: id,
                    label: "",
                    type: responseType
                }

                var originalLabel = response.data[responseType][id];
                var label = originalLabel;

                _.forEach(valuesArr, function(v) {
                    var regex = new RegExp('(' + v + ')', 'gi');

                    label = label.replace(regex, "<strong style='color:red'>$1</strong>")
                })

                resultItem.label = label;


                model.searchResults.push(resultItem);
            }

        })



    }




}())