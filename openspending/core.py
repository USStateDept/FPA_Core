import logging
import os
from flask import Flask, redirect, session, abort
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
#from google.refine import refineo

from openspending import default_settings
#from settings import OPENREFINE_SERVER 
#from settings import LOCKDOWN_FORCE
from openspending.lib.routing import NamespaceRouteRule
from openspending.lib.routing import FormatConverter, NoDotConverter
from flask import g
import flask_whooshalchemy as whoosearch
from flask_debugtoolbar import DebugToolbarExtension

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
        if request.method == "POST" and request.path not in ["/lockdown"]:
            token = session.get('csrf_token', None)
            resquesttoken = request.form.get('csrf_token', None)
            if request.json and not resquesttoken:
                resquesttoken = request.json.get('csrf_token')
            if not token or resquesttoken != token:
                abort(403)

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

        register_admin(app, db)

        from openspending.model import Dataset
        from openspending.model.country import Country
        whoosearch.whoosh_index(app,Dataset)
        whoosearch.whoosh_index(app, Country)

        from openspending.views.context import generate_csrf_token
        app.jinja_env.globals['csrf_token'] = generate_csrf_token 

        from openspending.assets.assets import register_assets
        register_assets(assets)  

        configure_template_filters(app)

        if os.environ.get("FLASK_DEBUGTOOLBAR", False):
            toolbar = DebugToolbarExtension(app)


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



from openspending.forum.utils.helpers import format_date, time_since, crop_title, \
    is_online, render_markup, mark_online, forum_is_unread, topic_is_unread
# permission checks (here they are used for the jinja filters)
from openspending.auth.forum import can_post_reply, can_post_topic, \
    can_delete_topic, can_delete_post, can_edit_post, can_edit_user, \
    can_ban_user, can_moderate, is_admin, is_moderator, is_admin_or_moderator

def configure_template_filters(app):
    """Configures the template filters."""

    app.jinja_env.filters['markup'] = render_markup
    app.jinja_env.filters['format_date'] = format_date
    app.jinja_env.filters['time_since'] = time_since
    app.jinja_env.filters['is_online'] = is_online
    app.jinja_env.filters['crop_title'] = crop_title
    app.jinja_env.filters['forum_is_unread'] = forum_is_unread
    app.jinja_env.filters['topic_is_unread'] = topic_is_unread
    # Permission filters
    app.jinja_env.filters['edit_post'] = can_edit_post
    app.jinja_env.filters['delete_post'] = can_delete_post
    app.jinja_env.filters['delete_topic'] = can_delete_topic
    app.jinja_env.filters['post_reply'] = can_post_reply
    app.jinja_env.filters['post_topic'] = can_post_topic
    # Moderator permission filters
    app.jinja_env.filters['is_admin'] = is_admin
    app.jinja_env.filters['is_moderator'] = is_moderator
    app.jinja_env.filters['is_admin_or_moderator'] = is_moderator
    app.jinja_env.filters['can_moderate'] = is_moderator

    app.jinja_env.filters['can_edit_user'] = can_edit_user
    app.jinja_env.filters['can_ban_user'] = is_moderator
