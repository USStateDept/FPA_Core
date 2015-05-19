import colander
from flask import Blueprint, render_template, request, redirect
from flask.ext.login import current_user
from flask import current_app

from openspending.auth import require
from openspending.views.cache import disable_cache


from wtforms import Form, TextField, PasswordField, validators



blueprint = Blueprint('findadmin', __name__)



@blueprint.route('/admin/dataloader', methods=['GET'])
def login():
    """ Render the login/registration page. """
    if not require.account.is_admin():
    	return redirect("/login", code=302)
    disable_cache()
    return render_template('admin/index.html')

