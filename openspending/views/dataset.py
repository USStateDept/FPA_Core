import json
import logging
from StringIO import StringIO
from urllib import urlencode

from webhelpers.feedgenerator import Rss201rev2Feed
from werkzeug.exceptions import BadRequest
from flask import Blueprint, render_template, request, redirect
from flask import Response
from flask.ext.login import current_user
from colander import SchemaNode, String, Invalid

from openspending.core import db
from openspending.model import Dataset, Badge
from openspending.lib.csvexport import write_csv
from openspending.lib.jsonexport import jsonify
from openspending.lib.paramparser import DatasetIndexParamParser
from openspending import auth
from openspending.lib.indices import cached_index
from openspending.lib.helpers import url_for, get_dataset
from openspending.lib.views import request_set_views
from openspending.lib.hypermedia import dataset_apply_links
from openspending.lib.pagination import Page
from openspending.reference.country import COUNTRIES
from openspending.validation.model.dataset import dataset_schema
from openspending.validation.model.common import ValidationState
from openspending.views.entry import index as entry_index
from openspending.views.cache import etag_cache_keygen, disable_cache

log = logging.getLogger(__name__)


blueprint = Blueprint('dataset', __name__)





@blueprint.route('/indicators/categories')
#@blueprint.route('/datasets.<fmt:format>')
def categories(format='html'):
    """ Get the datasets indicators list by category"""


    #get a list of the indicators by category

    #set up template


    return render_template('indicators/categories.html', page=page,
                           query=query,
                           language_options=language_options,
                           territory_options=territory_options,
                           category_options=category_options,
                           add_filter=add_filter,
                           del_filter=del_filter)

