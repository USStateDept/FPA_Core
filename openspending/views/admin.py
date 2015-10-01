import colander
from flask import Blueprint, render_template, request, redirect, Response
from flask.ext.login import current_user
from flask import current_app

from openspending.auth import require, admin_required


from wtforms import Form, TextField, PasswordField, validators

from openspending.model import Dataset
from openspending.admin.helpers import LoadReport



blueprint = Blueprint('findadmin', __name__)



@blueprint.route('/findadmin/dataloader', methods=['GET'])
@admin_required
def dataloader():
    """ Render the login/registration page. """
    return render_template('findadmin/index.html')





@blueprint.route('/findadmin/report')
@admin_required
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
