from flask import Blueprint, render_template, request, redirect, flash
from flask.ext.login import current_user, login_user, logout_user

from openspending.core import login_manager

from openspending.model.dataset import Dataset
from openspending.model import Account
from openspending.model.account import LockdownUser,load_account

from flask import current_app

#from settings import LOCKDOWNUSER, LOCKDOWNPASSWORD


blueprint = Blueprint('home', __name__)





@blueprint.route('/lockdown')
def lockdown():
    return render_template('home/lockdown.html')



@blueprint.route('/lockdown', methods=['POST', 'PUT'])
def lockdown_perform():
    username = request.form.get('username', '')
    password = request.form.get('password', '')
    LOCKDOWNUSER = current_app.config.get('LOCKDOWNUSER', 'test')
    LOCKDOWNPASSWORD = current_app.config.get('LOCKDOWNPASSWORD', 'test')

    if username.lower() == LOCKDOWNUSER and password == LOCKDOWNPASSWORD:
        account = load_account('all')
        #account = Account.all().first()
        login_user(account, remember=True)
        return redirect("/", code=302)
    else:
        return render_template('home/lockdown.html')


@blueprint.route('/about')
def about():
    #datasets = Dataset.all_by_account(current_user)
    #return render_template('home/index.jade', datasets=datasets)
    return render_template('about/about.jade')

@blueprint.route('/contact')
def contact():
    #datasets = Dataset.all_by_account(current_user)
    #return render_template('home/index.jade', datasets=datasets)
    return render_template('contact/contact.jade')

@blueprint.route('/legal')
def legal():
    #datasets = Dataset.all_by_account(current_user)
    #return render_template('home/index.jade', datasets=datasets)
    return render_template('legal/legal.jade')

@blueprint.route('/privacy')
def privacy():
    #datasets = Dataset.all_by_account(current_user)
    #return render_template('home/index.jade', datasets=datasets)
    return render_template('privacy/privacy.jade')

@blueprint.route('/terms')
def terms():
    #datasets = Dataset.all_by_account(current_user)
    #return render_template('home/index.jade', datasets=datasets)
    return render_template('terms/terms.jade')

@blueprint.route('/help')
def help():
    #datasets = Dataset.all_by_account(current_user)
    #return render_template('home/index.jade', datasets=datasets)
    return render_template('help/help.jade')

@blueprint.route('/accessibility')
def accessibility():
    #datasets = Dataset.all_by_account(current_user)
    #return render_template('home/index.jade', datasets=datasets)
    return render_template('accessibility/accessibility.jade')

@blueprint.route('/api')
def api():
    #datasets = Dataset.all_by_account(current_user)
    #return render_template('home/index.jade', datasets=datasets)
    return render_template('api/api.jade')

@blueprint.route('/pii')
def pii():
    #datasets = Dataset.all_by_account(current_user)
    #return render_template('home/index.jade', datasets=datasets)
    return render_template('pii/pii.jade')

@blueprint.route('/copyright')
def copyright():
    #datasets = Dataset.all_by_account(current_user)
    #return render_template('home/index.jade', datasets=datasets)
    return render_template('copyright/copyright.jade')

@blueprint.route('/glossary')
def glossary():
    #datasets = Dataset.all_by_account(current_user)
    #return render_template('home/index.jade', datasets=datasets)
    return render_template('glossary/glossary.jade')

@blueprint.route('/')
def index():
    #datasets = Dataset.all_by_account(current_user)
    #return render_template('home/index.jade', datasets=datasets)
    return render_template('home/index.jade')


@blueprint.route('/favicon.ico')
def favicon():
    return redirect('/static/favicon.ico', code=301)


######################OPENSPENDING STUFF#########################




@blueprint.route('/__version__')
def version():
    from openspending._version import __version__
    return __version__



@blueprint.route('/__ping__')
def ping():
    return 'pong' 