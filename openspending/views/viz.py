import json
import logging
from StringIO import StringIO
from urllib import urlencode

from webhelpers.feedgenerator import Rss201rev2Feed
from werkzeug.exceptions import BadRequest
from flask import Blueprint, render_template, request, redirect
from flask import Response
from flask.ext.login import current_user

from openspending.core import db
from openspending.model import Tags
from openspending.lib.csvexport import write_csv
from openspending.lib.jsonexport import jsonify
from openspending.lib.indices import cached_index
from openspending.reference.country import COUNTRIES
from openspending.views.cache import etag_cache_keygen, disable_cache

log = logging.getLogger(__name__)


blueprint = Blueprint('viz', __name__)





@blueprint.route('/visualization')
#@blueprint.route('/datasets.<fmt:format>')
def visualization(format='html'):
    """ Get the datasets indicators list by category"""
    # tags = []
    # for tag in Tags.all_by_category().all():
    #     tags.append(tag.as_dict())

    return render_template('visualization/visualization.jade')

