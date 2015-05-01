
import logging
import sys
import traceback
from slugify import slugify
import json

from flask import Blueprint, request
from flask.ext.login import current_user
from colander import SchemaNode, String, Invalid
from restpager import Pager

from openspending.core import db
from openspending.model import Feedback
from openspending.lib.jsonexport import jsonify

log = logging.getLogger(__name__)
blueprint = Blueprint('feedback', __name__)


@blueprint.route('/feedback', methods=['POST', 'PUT'])
def feedback_post():
    """
    This takes a json format post with label, name, description
    and creates a private dataset to put sources in
    The json_errors return a json object
    """

    try:
    	feedback = Feedback()
    	feedback.email = request.form.get("email", None)
    	feedback.name = request.form.get("name", None)
    	feedback.message = request.form.get("message", None)
    	feedback.url = request.form.get("url", None)

        db.session.add(feedback)
        db.session.commit()
        return jsonify({"success":True})
    except Exception, e:
        ex_type, ex, tb = sys.exc_info()
        print traceback.print_tb(tb)
        return jsonify({"errors":['Unknown Error has occurred: ' + str(e)]})