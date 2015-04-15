import logging
import sys
import traceback
import json

from flask import Blueprint, request
from flask.ext.login import current_user
from flask.ext.babel import gettext as _

from openspending.core import db

from openspending.model import Dataview
from openspending.auth import require
from openspending.lib.jsonexport import jsonify
from openspending.lib.indices import clear_index_cache
from openspending.views.cache import etag_cache_keygen
from openspending.views.context import api_form_data
from openspending.views.error import api_json_errors


log = logging.getLogger(__name__)
blueprint = Blueprint('dataview_api2', __name__)



@blueprint.route('/dataviews')
@api_json_errors
def dataviews():
    #page = request.args.get('page')

    q = Dataview.all().all()

    return jsonify(q, headers= {'Cache-Control' : 'no-cache'})



@blueprint.route('/dataview/<urlhash>')
@api_json_errors
def view(urlhash):
    """
    Get the dataset info to populate a form
    """

    dataview = Dataview.by_urlhash(urlhash)
    etag_cache_keygen(dataview)
    return jsonify(dataview, headers= {'Cache-Control' : 'no-cache'})


@blueprint.route('/dataview', methods=['POST', 'PUT'])
@api_json_errors
def create():
    """
    This takes a json format post with label, name, description
    and creates a private dataset to put sources in
    The json_errors return a json object
    """

    # if not require.dataview.create():
    #     return jsonify({"errors":["Can not create new dataset.  Permission denied"]})

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

