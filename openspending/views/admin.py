import colander
from flask import Blueprint, render_template, request, redirect
from flask.ext.login import current_user
from flask import current_app

from openspending.auth import require


from wtforms import Form, TextField, PasswordField, validators



blueprint = Blueprint('findadmin', __name__)



@blueprint.route('/findadmin/dataloader', methods=['GET'])
def dataloader():
    """ Render the login/registration page. """
    if not require.account.is_admin():
    	return redirect("/login", code=302)
    return render_template('findadmin/index.html')

