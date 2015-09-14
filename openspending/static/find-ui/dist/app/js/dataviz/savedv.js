$(function() {
    var dialog, form, msgdialog,

      // From http://www.whatwg.org/specs/web-apps/current-work/multipage/states-of-the-type-attribute.html#e-mail-state-%28type=email%29
      title = $( "#savedv-title" ),
      description = $( "#savedv-description" ),
      allFields = $( [] ).add( title ).add( description ),
      tips = $( ".validateTips" );

    function updateTips( t ) {
      tips
        .text( t )
        .addClass( "ui-state-highlight" );
      setTimeout(function() {
        tips.removeClass( "ui-state-highlight", 1500 );
      }, 500 );
    }

    function checkLength( o, n, min, max ) {
      if ( o.val().length > max || o.val().length < min ) {
        o.addClass( "ui-state-error" );
        updateTips( "Length of " + n + " must be between " +
          min + " and " + max + "." );
        return false;
      } else {
        return true;
      }
    }



    function saveDV() {
      var valid = true;
      allFields.removeClass( "ui-state-error" );

      valid = valid && checkLength( title, "title", 2, 100 );


      if ( valid ) {
        
        var viz_settings = encodeURI(location.hash).substring(1);
        if (viz_settings == "") {
          dialog.dialog( "close" );
          openMsgDialog("There is no visualization to save");
        } else {
          var tempdata = {"title":title.val(),
                          "description": description.val(),
                          "csrf_token": $("#csrf_token").val(),
                          "viz_settings": viz_settings};
          dialog.dialog( "close" );
          $.post("/user/adddv", tempdata,
              function(res){
                openMsgDialog(res.message);
              });
        }
      }
      return valid;
    }

    dialog = $( "#dialog-form" ).dialog({
      autoOpen: false,
      height: 300,
      width: 350,
      modal: true,
      buttons: {
        "Save Data Visualization": saveDV,
        Cancel: function() {
          dialog.dialog( "close" );
        }
      },
      close: function() {
        form[ 0 ].reset();
        allFields.removeClass( "ui-state-error" );
      }
    });

    form = dialog.find( "form" ).on( "submit", function( event ) {
      event.preventDefault();
      saveDV();
    });

    window.popupDVSave = function(){
        dialog.dialog( "open" );
    };

    function openMsgDialog(msg){
        $("#dialog-form-msg .dvsave-msg").html(msg);
        msgdialog.dialog( "open" );
    }

    msgdialog = $( "#dialog-form-msg" ).dialog({
      modal: true,
      autoOpen: false,
      height: 300,
      width: 350,
      buttons: {
        Ok: function() {
          $( this ).dialog( "close" );
        }
      }
    });

});