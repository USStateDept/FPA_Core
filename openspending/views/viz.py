import json
import logging
from StringIO import StringIO
from urllib import urlencode

from werkzeug.exceptions import BadRequest
from flask import Blueprint, render_template, request, redirect
from flask import Response
from flask.ext.login import current_user

from openspending.core import db
from openspending.model import Tags

from openspending.views.api_v2.countries import countries_list

log = logging.getLogger(__name__)


blueprint = Blueprint('viz', __name__)





@blueprint.route('/visualization')
#@blueprint.route('/datasets.<fmt:format>')
def visualization(format='html'):
    """ Get the datasets indicators list by sec"""
    # tags = []
    # for tag in Tags.all_by_category().all():
    #     tags.append(tag.as_dict())
    countries_list_data = countries_list()

    return render_template('visualization/visualization.jade',
                            countries_list=countries_list_data)


@blueprint.route('/data-visualization')
#@blueprint.route('/datasets.<fmt:format>')
def datavisualization(format='html'):
    """ 
    Provide the template and associated data for the data-visualization of the site
    """
    countries_list_data = countries_list()
    # tags = []
    # for tag in Tags.all_by_category().all():
    #     tags.append(tag.as_dict())

    return render_template('dataviz/data-visualization.jade', 
                            countries_list=countries_list_data)


@blueprint.route('/countries')
#@blueprint.route('/datasets.<fmt:format>')
def countries(format='html'):
    """ Get the datasets indicators list by category"""
    # tags = []
    # for tag in Tags.all_by_category().all():
    #     tags.append(tag.as_dict())
    countries_list_data = countries_list()

    return render_template('countries/countries.jade',
                countries_list=countries_list_data)

@blueprint.route('/categories')
#@blueprint.route('/datasets.<fmt:format>')
def categories(format='html'):
    """ Get the datasets indicators list by category"""
    # tags = []
    # for tag in Tags.all_by_category().all():
    #     tags.append(tag.as_dict())

    return render_template('categories/categories.jade')

@blueprint.route('/data')
#@blueprint.route('/datasets.<fmt:format>')
def data(format='html'):
    """ Get the datasets indicators list by category"""
    # tags = []
    # for tag in Tags.all_by_category().all():
    #     tags.append(tag.as_dict())

    return render_template('data/data.jade')