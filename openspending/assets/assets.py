



def register_assets(assets_class):

    from flask.ext.assets import Bundle
 

    if "slickgrid" not in assets_class:
        tempjs = Bundle('find-ui/bower_components/slickgrid/lib/jquery.event.drag-2.2.js',
                        'find-ui/bower_components/slickgrid/slick.core.js',
                        'find-ui/bower_components/slickgrid/slick.grid.js',
                        'find-ui/bower_components/slickgrid/slick.dataview.js',
                        'find-ui/bower_components/slickgrid/plugins/slick.checkboxselectcolumn.js',
                        'find-ui/bower_components/slickgrid/plugins/slick.rowselectionmodel.js',
                        'find-ui/bower_components/slickgrid-bootstrap/bootstrap/bootstrap-slickgrid.js',
                        filters='jsmin',
                        output='slickgrid.js')
        assets_class.register('slickgrid',tempjs)  

    if "vendor_common_js" not in assets_class:
        tempjs = Bundle('find-ui/bower_components/jquery-ui/jquery-ui.js',
                        'find-ui/bower_components/jquery-ui-slider-pips/dist/jquery-ui-slider-pips.min.js',
                        'find-ui/bower_components/lodash/lodash.min.js',
                        'find-ui/bower_components/leaflet/dist/leaflet.js',
                        'find-ui/bower_components/knockout/dist/knockout.js',
                        'find-ui/bower_components/highcharts/highcharts.js',
                        'find-ui/bower_components/highcharts/highcharts-more.js',
                        'find-ui/bower_components/highcharts/modules/exporting.js',
                        filters=None,
                        output='vendor_common_js.js')
        assets_class.register('vendor_common_js', tempjs)

    if "interactive_common_js" not in assets_class:
        tempjs = Bundle('find-ui/dist/app/js/lib/jquery-ui.multiselect.min.js',
                        'find-ui/dist/app/js/common/config.js',
                        'find-ui/dist/app/js/common/loader.js',
                        'find-ui/dist/app/js/common/utils.js',
                        'find-ui/dist/app/js/common/viz-model.js',
                        'find-ui/dist/app/js/visualization/visualization.js',
                        filters='jsmin',
                        output='interactive_common_js.js')
        assets_class.register('interactive_common_js',tempjs)       








# categories/categories.jade
# link(href='//code.jquery.com/ui/1.11.4/themes/smoothness/jquery-ui.css', rel='stylesheet')




# data/data.jade
# link(href='//code.jquery.com/ui/1.11.4/themes/smoothness/jquery-ui.css', rel='stylesheet')

# script(src="{{ static_path('find-ui/dist/app/js/data/data.js') }}")



# dataviz/data-visualization.jade


# script(src="{{ static_path('find-ui/dist/app/js/dataviz/dataviz.js') }}")



# visualization/visualization.jade













# findadmin/index.html
# <script type="text/javascript" src="/static/dataloader/build/vendor/angular/angular.js"></script>
# <script type="text/javascript" src="/static/dataloader/build/vendor/angular-bootstrap/ui-bootstrap-tpls.min.js"></script>
# <script type="text/javascript" src="/static/dataloader/build/vendor/angular-ui-router/release/angular-ui-router.js"></script>
# <script type="text/javascript" src="/static/dataloader/build/vendor/angular-cookies/angular-cookies.min.js"></script>
# <script type="text/javascript" src="/static/dataloader/build/vendor/jquery/dist/jquery.min.js"></script>
# <script type="text/javascript" src="/static/dataloader/build/vendor/angular-chosen-localytics/chosen.js"></script>
# <script type="text/javascript" src="/static/dataloader/build/vendor/underscore/underscore-min.js"></script>
# <script type="text/javascript" src="/static/dataloader/build/vendor/datatables/media/js/jquery.dataTables.min.js"></script>
# <script type="text/javascript" src="/static/dataloader/build/src/app/app.js"></script>
# <script type="text/javascript" src="/static/dataloader/build/src/app/modeler/modeler.js"></script>
# <script type="text/javascript" src="/static/dataloader/build/templates-common.js"></script>
# <script type="text/javascript" src="/static/dataloader/build/templates-app.js"></script>