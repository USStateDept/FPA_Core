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


blueprint = Blueprint('indicators', __name__)





@blueprint.route('/indicators/categories')
#@blueprint.route('/datasets.<fmt:format>')
def categories(format='html'):
    """ Get the datasets indicators list by category"""
    tags = []
    for tag in Tags.all_by_category().all():
        tags.append(tag.as_dict())

    return render_template('indicators/categories.jade',
                            tags=tags)


@blueprint.route('/indicators/categories/datasets')
#@blueprint.route('/datasets.<fmt:format>')
def datasets_by_tag():
    """ Get the datasets indicators list by category"""

    slugarg = request.args.get("slug_label", None)

    tag_result = Tags.datasets_by_tag(slug_label=slugarg)

    if not tag_result:
        print "could not find the tag"
        return
    datasets = []
    for dataset in tag_result.datasets:
        if dataset.source.loadable:
            datasets.append(dataset.as_dict())


    return render_template('indicators/_categories_datasets.jade',
                            datasets=datasets)





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


