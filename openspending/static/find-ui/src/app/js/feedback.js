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



        $("#feedbackform").submit(function(ev){
            $("#feedbackbtn").hide();
 
            var data = $(this).serialize() + "&url=" + window.location.href;
            $.ajax({
                type: 'POST',
                url: '/feedback',
                data: data,
                cache: false,
                success: function(res){
                    if (res.success){
                        $(".popupcontainer").html("Thank you for your feedback.");
                    }
                    else{
                        $(".popupcontainer").html("Sorry we hit an error.  This will be noted and fixed");
                    }

                    
                },
                error: function(){
                    $(".popupcontainer").html("Sorry we hit an error.  This will be noted and fixed");
                }
            });
            ev.preventDefault();
            return false;


        });


    });

})(jQuery);