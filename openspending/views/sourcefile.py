import logging

from flask import Blueprint, render_template, redirect, request
from flask.ext.login import current_user
from werkzeug.exceptions import BadRequest

from openspending.core import db, sourcefiles
from openspending.model.sourcefile import SourceFile
from openspending.auth import *
from openspending.lib.jsonexport import jsonify
from openspending.lib.helpers import url_for, obj_or_404, get_dataset


log = logging.getLogger(__name__)
blueprint = Blueprint('sourcefile', __name__)





@blueprint.route('/sourcefiles/create', methods=['GET', 'POST'])
@admin_required
def upload():
    """ Create a new badge in the system """

    # TODO: some data validation wouldn't hurt.
    if request.method == 'POST':
        upload_source_path = sourcefiles.save(request.files['rawfile'])
        sourcefile = SourceFile(upload_source_path)
        db.session.add(sourcefile)
        db.session.commit()

    return render_template('home/index.jade')
