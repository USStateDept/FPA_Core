import logging

from flask import Blueprint, render_template, g, request, redirect
from werkzeug.exceptions import BadRequest

from openspending.lib.helpers import url_for, obj_or_404

from openspending.views.cache import disable_cache

from openspending.model import Dataset

log = logging.getLogger(__name__)
blueprint = Blueprint('search', __name__)



@blueprint.route('/search', methods=['POST'])
def search_post():
    if not g.search_form.validate_on_submit():
        return redirect(url_for('home.index'))
    return redirect(url_for('search.search_results', query=g.search_form.search.data))


@blueprint.route('/search_results/<query>')
def search_results(query):
    results = Dataset.query.whoosh_search(query).all()
    return render_template('search/search_results.jade',
                           query=query,
                           results=results)