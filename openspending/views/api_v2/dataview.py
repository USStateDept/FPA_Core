import logging
import sys
import traceback
import json

from flask import Blueprint, request
from flask.ext.login import current_user

from openspending.core import db

from openspending.model import Dataview
from openspending.lib.jsonexport import jsonify
from openspending.views.context import api_form_data
from openspending.views.error import api_json_errors
from openspending.auth import authenticated_required


log = logging.getLogger(__name__)
blueprint = Blueprint('dataview_api2', __name__)




@blueprint.route('/dataview', methods=['POST', 'PUT'])
@authenticated_required
@api_json_errors
def create():
    """
    This takes a json format post with label, name, description
    and creates a private dataset to put sources in
    The json_errors return a json object
    """


    try:
        dataview_form = api_form_data()
        #make checks here for various secuirty and validation
        if dataview_form['urlhash']:
            dataview = Dataview.by_urlhash(dataview_form['urlhash'])
            dataview.update(dataview_form)
        else:
            dataview = Dataview(dataview_form)
            db.session.add(dataview)


        db.session.commit()
        return jsonify(dataview)
    except Exception, e:
        ex_type, ex, tb = sys.exc_info()
        print traceback.print_tb(tb)
        return jsonify({"errors":['Unknown Error has occurred: ' + str(e)]})

