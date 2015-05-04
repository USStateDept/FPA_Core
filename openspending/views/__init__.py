from cubes.server import slicer

from openspending.lib import filters

from openspending.views.context import home
from openspending.views.cache import NotModified, handle_not_modified

# from openspending.views.entry import blueprint as entry
from openspending.views.account import blueprint as account
from openspending.views.sourcefile import blueprint as sourcefile
from openspending.views.indicators import blueprint as indicators
from openspending.views.feedback import blueprint as feedback
from openspending.views.search import blueprint as search
# from openspending.views.badge import blueprint as badge
# from openspending.views.view import blueprint as view
# from openspending.views.editor import blueprint as editor
# from openspending.views.source import blueprint as source
# from openspending.views.run import blueprint as run
# from openspending.views.dimension import blueprint as dimension
from openspending.views.error import handle_error
from openspending.views import api_v2
from openspending.views.api_v2.dataset import blueprint as datasets_v3
from openspending.views.api_v2.references import blueprint as references_v3
from openspending.views.api_v2.dataview import blueprint as dataview_v3
from openspending.views.api_v2.categories import blueprint as categories_v3
from openspending.views.api_v2.search import blueprint as search_v3


def register_views(app):

    app.register_blueprint(home)
    # app.register_blueprint(entry)
    app.register_blueprint(account)
    app.register_blueprint(sourcefile)
    app.register_blueprint(indicators)
    app.register_blueprint(feedback)
    app.register_blueprint(search)

    # app.register_blueprint(badge)
    # app.register_blueprint(view)
    # app.register_blueprint(editor)
    # app.register_blueprint(source)
    # app.register_blueprint(run)
    app.register_blueprint(api_v2.blueprint)
    app.register_blueprint(categories_v3, url_prefix='/api/3')
    #app.register_blueprint(dimension)

    app.register_blueprint(datasets_v3, url_prefix='/api/3')
    app.register_blueprint(references_v3, url_prefix='/api/3')
    app.register_blueprint(dataview_v3, url_prefix='/api/3')
    app.register_blueprint(search_v3, url_prefix='/api/3')

    # expose ``cubes``:
    app.register_blueprint(slicer, url_prefix='/api/slicer', config={})

    app.error_handler_spec[None][400] = handle_error
    app.error_handler_spec[None][401] = handle_error
    app.error_handler_spec[None][402] = handle_error
    app.error_handler_spec[None][403] = handle_error
    app.error_handler_spec[None][404] = handle_error
    app.error_handler_spec[None][500] = handle_error

    app.error_handler_spec[None][NotModified] = handle_not_modified

    app.jinja_env.filters.update({
        'markdown_preview': filters.markdown_preview,
        'markdown': filters.markdown,
        'format_date': filters.format_date,
        'readable_url': filters.readable_url
    })

