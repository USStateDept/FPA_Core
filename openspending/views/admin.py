import colander
from flask import Blueprint, render_template, request, redirect, Response
from flask.ext.login import current_user
from flask import current_app

from openspending.auth import require


from wtforms import Form, TextField, PasswordField, validators

from openspending.model import Dataset
from openspending.admin.helpers import LoadReport



blueprint = Blueprint('findadmin', __name__)



@blueprint.route('/findadmin/dataloader', methods=['GET'])
def dataloader():
    """ Render the login/registration page. """
    if not require.account.is_admin():
    	return redirect("/login", code=302)
    return render_template('findadmin/index.html')





@blueprint.route('/findadmin/report')
def report():
    dataset_id = request.args.get("id", None)
    if not dataset_id:
        raise
    dataset = Dataset.by_id(dataset_id)
    if not dataset:
        raise
    lr = LoadReport(dataset)
    return Response(lr.get_output(),
                mimetype='application/zip',
                headers={'Content-Disposition':'attachment;filename=%s.zip'%dataset.name})
