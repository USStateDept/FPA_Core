import logging
from flask import Flask, redirect
from flask.ext.sqlalchemy import SQLAlchemy
from flask.ext.login import LoginManager
from flask.ext.cache import Cache
from flask.ext.mail import Mail
from flask.ext.assets import Environment
from flaskext.uploads import UploadSet, IMAGES, configure_uploads
import formencode_jinja2
from celery import Celery
from cubes import Workspace
#from flask.ext.httpauth import HTTPDigestAuth
from flask.ext.login import current_user
from flask import request
#from cubes.extensions import extensions
#from google.refine import refine

from openspending import default_settings
#from settings import OPENREFINE_SERVER 
#from settings import LOCKDOWN_FORCE
from openspending.lib.routing import NamespaceRouteRule
from openspending.lib.routing import FormatConverter, NoDotConverter
#from flask.ext.superadmin import Admin, model
import flask_admin as admin
from flask import g
import flask_whooshalchemy as whoosearch

logging.basicConfig(level=logging.DEBUG)

# specific loggers
logging.getLogger('cubes').setLevel(logging.WARNING)
logging.getLogger('markdown').setLevel(logging.WARNING)


db = SQLAlchemy()
login_manager = LoginManager()
cache = Cache()
mail = Mail()
assets = Environment()
#auth = HTTPDigestAuth()

sourcefiles = UploadSet('sourcefiles', extensions=('txt', 'rtf', 'odf', 'ods', 'pdf', 'doc', 'docx', 'xls', 'xlsx', 'csv', 'json', 'xml'))





def create_app(**config):
    app = Flask(__name__)
    app.url_rule_class = NamespaceRouteRule
    app.url_map.converters['fmt'] = FormatConverter
    app.url_map.converters['nodot'] = NoDotConverter

    app.config.from_object(default_settings)
    app.config.from_envvar('OPENSPENDING_SETTINGS', silent=True)
    app.config.update(config)

    app.jinja_options['extensions'].extend([
        formencode_jinja2.formfill,
        'jinja2.ext.i18n'
    ])

    db.init_app(app)
    cache.init_app(app)
    mail.init_app(app)
    assets.init_app(app)
    login_manager.init_app(app)
    configure_uploads(app, (sourcefiles,))

    @app.before_request
    def require_basic_auth(*args, **kwargs):
        LOCKDOWN_FORCE = app.config['LOCKDOWN_FORCE']
        if not current_user.is_authenticated() and request.path not in ["/lockdown", "/__ping__"] and LOCKDOWN_FORCE:
            return redirect("/lockdown", code=302)
        from openspending.model.search import SearchForm
        g.search_form = SearchForm()

    with app.app_context():
        app.cubes_workspace = Workspace()
        
        app.cubes_workspace.register_default_store('OpenSpendingStore')


    return app


def create_web_app(**config):
    app = create_app(**config)

    app.jinja_env.add_extension('pyjade.ext.jinja.PyJadeExtension')

    with app.app_context():

        from openspending.views import register_views
        register_views(app)

        from openspending.admin.routes import register_admin
        flaskadmin = admin.Admin(app, name='FIND Admin')
        #flaskadmin = Admin(app, url='/admin', name='admin2')
        register_admin(flaskadmin, db)

        from openspending.model import Dataset
        whoosearch.whoosh_index(app,Dataset)

    return app


def create_celery(app):
    celery = Celery(app.import_name, broker=app.config['CELERY_BROKER_URL'])
    celery.conf.update(app.config)
    TaskBase = celery.Task

    class ContextTask(TaskBase):
        abstract = True
        
        def __call__(self, *args, **kwargs):
            with app.app_context():
                return TaskBase.__call__(self, *args, **kwargs)
    
    celery.Task = ContextTask
    return celery
