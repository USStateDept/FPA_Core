import os
import tempfile


SECRET_KEY = 'foo'
DEBUG = True
TESTING = True

SITE_TITLE = 'FIND'

SQLALCHEMY_DATABASE_URI = 'postgresql://postgres:1Password@localhost/openspending_testing'

MAIL_SERVER = 'localhost'
MAIL_PORT = 25
# MAIL_USE_TLS = False
# MAIL_USE_SSL = False
# MAIL_USERNAME = None
# MAIL_PASSWORD = None
MAIL_DEFAULT_SENDER = 'noreply@openspending.org'

CACHE = True
CACHE_TYPE = 'simple'


CELERY_BROKER_URL = 'amqp://guest:guest@localhost:5672//'

CELERY_ALWAYS_EAGER = True

APP_ROOT = tempfile.mkdtemp()


#update this if you have a proxy on apache
#public is public exposed URL
#private is theprivate address for the server to access
OPENREFINE_PUBLIC = "http://localhost:3333"
OPENREFINE_SERVER = "http://localhost:3333"

DEFAULT_FILE_STORAGE = 'filesystem'

UPLOADS_FOLDER = tempfile.mkdtemp()

FILE_SYSTEM_STORAGE_FILE_VIEW = 'static'

#UploadSet Flask-uploads management of files
UPLOADED_FILES_DEST = tempfile.mkdtemp()

#domain whitelist 
EMAIL_WHITELIST = ['state.gov', 'whitehouse.gov']


#approved hosts for proxy
APPROVED_HOSTS = ["localhost:3333", "path_to_google_refine"]


LOCKDOWNUSER = "test"
LOCKDOWNPASSWORD = "test"

LOCKDOWN_FORCE = False

#UploadSet Flask-uploads management of files
WHOOSH_BASE = tempfile.mkdtemp()