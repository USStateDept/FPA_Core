(function($) {

    $( document ).ready(function() {

        $(".category-wrapper").click(function(ev){
            var data = {"slug_label": $(this).attr("id")};
            $('.jumbotron').html("loading...");
            $.ajax({
                type: 'GET',
                url: '/indicators/categories/datasets',
                data: data,
                cache: true,
                success: function(res){
                    $(".jumbotron").html(res);
                },
                error: function(){
                    $(".jumbotron").html("Sorry we hit an error.  This will be noted and fixed");
                }
            });
        });
    });

})(jQuery);