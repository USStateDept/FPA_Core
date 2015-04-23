(function($) {

    $( document ).ready(function() {


        $(".expandbtn").click(function(ev){
            if ($(this).hasClass("expanded")){
                $(this).removeClass("expanded").html("<<");
                $(".popupcontainer").hide();
                $(".warningmessage").hide();
                $.cookie("shownfeedback", true);
            }
            else{
                $(this).addClass("expanded").html(">>");
                $(".popupcontainer").show();
            }
        });

        var cookieValue = $.cookie("shownfeedback");
        if (cookieValue){
            $(".expandbtn").click();
            $(".warningmessage").hide();
        }


    });

})(jQuery);