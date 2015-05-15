from flask import Blueprint, render_template, request, redirect, flash
from flask.ext.login import current_user, login_user, logout_user

from openspending.core import login_manager

from openspending.model.dataset import Dataset
from openspending.views.cache import disable_cache
from openspending.model import Account

from settings import LOCKDOWNUSER, LOCKDOWNPASSWORD


blueprint = Blueprint('home', __name__)


class User():
    def is_authenticated(self):
        return True
    def is_active(self):
        return True
    def is_anonymous(self):
        return False
    def get_id(self):
        return 999999999
    @property
    def admin(self):
        False

@login_manager.user_loader
def load_user(userid):
    return User()



@blueprint.route('/lockdown')
def lockdown():
    return render_template('home/lockdown.html')



@blueprint.route('/lockdown', methods=['POST', 'PUT'])
def lockdown_perform():
    username = request.form.get('username', '')
    password = request.form.get('password', '')

    if username.lower() == LOCKDOWNUSER and password == LOCKDOWNPASSWORD:
        account = load_user('all')
        #account = Account.all().first()
        login_user(account, remember=True)
        return redirect("/", code=302)
    else:
        return render_template('home/lockdown.html')




@blueprint.route('/')
def index():
    datasets = Dataset.all_by_account(current_user)
    return render_template('home/index.jade', datasets=datasets)


@blueprint.route('/favicon.ico')
def favicon():
    return redirect('/static/img/favicon.ico', code=301)


######################OPENSPENDING STUFF#########################




@blueprint.route('/__version__')
def version():
    from openspending._version import __version__
    return __version__



@blueprint.route('/__ping__')
def ping():
    return 'pong' 