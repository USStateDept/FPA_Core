



def register_assets(assets_class):

    from flask.ext.assets import Bundle

# script(src="{{ 
# script(src="{{ 
# script(src="{{ static_path('find-ui/bower_components/knockout/dist/knockout.js')
# script(src="{{ static_path('find-ui/bower_components/lodash/lodash.min.js')
# script(src="{{ static_path('find-ui/dist/app/js/common.js') }}")
# script(src="{{ static_path('find-ui/dist/app/js/home/home.js') }}")


    if "common" not in assets_class:
        tempjs = Bundle('find-ui/bower_components/letteringjs/jquery.lettering.js',
                        'find-ui/bower_components/knockout/dist/knockout.js',
                        'find-ui/bower_components/lodash/lodash.min.js',
                        'find-ui/dist/app/js/common.js',
                        filters='jsmin',
                        output='compiled.js')
        assets_class.register('common',tempjs)


    if "home" not in assets_class:
        tempjs = Bundle('find-ui/bower_components/letteringjs/jquery.lettering.js',
                        'find-ui/dist/app/js/common.js',
                        filters='jsmin',
                        output='home.js')
        assets_class.register('home',tempjs)