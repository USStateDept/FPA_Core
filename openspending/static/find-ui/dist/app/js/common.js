(function() {
    //scroll aniation on href
    $(function() {
        $('a[href*=#]:not([href=#])').click(function() {
            if (location.pathname.replace(/^\//, '') == this.pathname.replace(/^\//, '') && location.hostname == this.hostname) {
                var target = $(this.hash);
                target = target.length ? target : $('[name=' + this.hash.slice(1) + ']');
                if (target.length) {
                    $('html,body').animate({
                        scrollTop: target.offset().top
                    }, 1000);
                    return false;
                }
            }
        });
    });

    //stick div for homepage
    function sticky_relocate() {
        var window_top = $(window).scrollTop();
        var div_top = $('#sticky-anchor').offset().top;
        if (window_top + 60 > div_top) {
            $('#sticky').addClass('stick');
        } else {
            $('#sticky').removeClass('stick');
        }
    }

    $(function() {
        $(window).scroll(sticky_relocate);
        sticky_relocate();
    });

    //textillate
    $('.tlt').textillate({
        // the default selector to use when detecting multiple texts to animate
        selector: '.tlt',

        // enable looping
        loop: false,

        // sets the minimum display time for each text before it is replaced
        minDisplayTime: 2000,

        // sets the initial delay before starting the animation
        // (note that depending on the in effect you may need to manually apply 
        // visibility: hidden to the element before running this plugin)
        initialDelay: 0,

        // set whether or not to automatically start animating
        autoStart: true,

        // custom set of 'in' effects. This effects whether or not the 
        // character is shown/hidden before or after an animation  
        inEffects: ['flipInY'],

        // custom set of 'out' effects
        outEffects: [],

        // in animation settings
        in : {
            // set the effect name
            effect: 'flipInY', //flipInY, fadeInLeftBig, rollIn

            // set the delay factor applied to each consecutive character
            delayScale: 1.5,

            // set the delay between each character
            delay: 50,

            // set to true to animate all the characters at the same time
            sync: false,

            // randomize the character sequence 
            // (note that shuffle doesn't make sense with sync = true)
            shuffle: true,

            // reverse the character sequence 
            // (note that reverse doesn't make sense with sync = true)
            reverse: false,

            // callback that executes once the animation has finished
            callback: function() {}
        },

        // out animation settings.
        out: {
            effect: 'hinge',
            delayScale: 1.5,
            delay: 50,
            sync: false,
            shuffle: false,
            reverse: false,
            callback: function() {}
        },

        // callback that executes once textillate has finished 
        callback: function() {},

        // set the type of token to animate (available types: 'char' and 'word')
        type: 'char'
    });

}())