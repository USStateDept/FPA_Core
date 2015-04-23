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
from openspending.model import Dataset
from openspending.lib.csvexport import write_csv
from openspending.lib.jsonexport import jsonify
from openspending.lib.indices import cached_index
from openspending.lib.helpers import url_for, get_dataset
from openspending.reference.country import COUNTRIES
from openspending.views.cache import etag_cache_keygen, disable_cache

log = logging.getLogger(__name__)


blueprint = Blueprint('indicators', __name__)





@blueprint.route('/indicators/categories')
#@blueprint.route('/datasets.<fmt:format>')
def categories(format='html'):
    """ Get the datasets indicators list by category"""


    #get a list of the indicators by category

    #set up template


    return render_template('indicators/categories.jade')
        # , page=page,
        #                    query=query,
        #                    language_options=language_options,
        #                    territory_options=territory_options,
        #                    category_options=category_options,
        #                    add_filter=add_filter,
        #                    del_filter=del_filter)





@blueprint.route('/indicators/countries')
#@blueprint.route('/datasets.<fmt:format>')
def countries(format='html'):
    """ Get the datasets indicators list by category"""


    #get a list of countries and associated images for their flags




    return render_template('indicators/list-countries.jade')
        # , page=page,
        #                    query=query,
        #                    language_options=language_options,
        #                    territory_options=territory_options,
        #                    category_options=category_options,
        #                    add_filter=add_filter,
        #                    del_filter=del_filter)


