import logging
import collections
import json

from flask import request
from flask.ext.login import current_user
from flask import Blueprint, request


from openspending.lib.findui import jsonp

# from openspending.auth import require
from openspending.model.dataset import Dataset
from openspending.model.country import Country
from openspending.views.error import api_json_errors
# from openspending.lib import util
# from openspending.lib.browser import Browser
# from openspending.lib.streaming import JSONStreamingResponse
# from openspending.lib.streaming import CSVStreamingResponse
# from openspending.lib.jsonexport import jsonify
# from openspending.lib.csvexport import write_csv
# from openspending.lib.paramparser import SearchParamParser
# from openspending.lib.hypermedia import entry_apply_links
# from openspending.lib.hypermedia import dataset_apply_links
# from openspending.views.cache import etag_cache_keygen
#rom openspending.views.api_v2.common import blueprint


log = logging.getLogger(__name__)
blueprint = Blueprint('search_api2', __name__)


@blueprint.route('/partialsearch')
@api_json_errors
@jsonp
def partialsearch_api():

    q = request.args.get('q', None)
    if not q:
        return jsonify({})

    results = Dataset.query.whoosh_search(q + "*").limit(10).all()
    items = collections.OrderedDict()
    for result in results:
        items[result.name] = result.label

    return json.dumps(items)




#use /all, /countries, /indicators
@blueprint.route('/search')
@blueprint.route('/search/<searchtype>')
@api_json_errors
@jsonp
def search_api(searchtype= 'all'):

    q = request.args.get('q', None)
    if not q:
        return jsonify({})

    returnobj = {'data':{}}
    if searchtype not in ['all', 'indicators', 'countries']:
        searchtype = 'all'

    if searchtype in ['all', 'indicators']:
        results = Dataset.query.whoosh_search(q + "*", or_=True)
        results_count = results.count()
        results = results.limit(25).all()
        returnobj['totaldatasets'] = results_count
        items = collections.OrderedDict()
        for result in results:
            items[result.name] = result.label
        returnobj['data']['indicators'] = items

    if searchtype in ['all', 'countries']:
        results = Country.query.whoosh_search(q + "*", or_=True)
        results_count = results.count()
        results = results.limit(25).all()
        returnobj['totalcountries'] = results_count
        items = collections.OrderedDict()
        for result in results:
            items[result.geounit] = result.label
        returnobj['data']['countries'] = items

    return json.dumps(returnobj)


# @blueprint.route('/api/3/search')
# def search_api():
#     parser = SearchParamParser(request.args)
#     params, errors = parser.parse()

#     if errors:
#         return jsonify({'errors': errors}, status=400)

#     expand_facets = params.pop('expand_facet_dimensions')

#     format = params.pop('format')
#     if format == 'csv':
#         params['stats'] = False
#         params['facet_field'] = None

#     datasets = params.pop('dataset', None)
#     if datasets is None or not datasets:
#         q = Dataset.all_by_account(current_user)
#         if params.get('category'):
#             q = q.filter_by(category=params.pop('category'))
#         datasets = q.all()
#         expand_facets = False

#     if not datasets:
#         return jsonify({'errors': ["No dataset available."]}, status=400)

#     params['filter']['dataset'] = []
#     for dataset in datasets:
#         require.dataset.read(dataset)
#         params['filter']['dataset'].append(dataset.name)

#     etag_cache_keygen(parser.key(), max([d.updated_at for d in datasets]))

#     if params['pagesize'] > parser.defaults['pagesize']:
#         if format == 'csv':
#             streamer = CSVStreamingResponse(
#                 datasets,
#                 params,
#                 pagesize=parser.defaults['pagesize']
#             )
#             return streamer.response()
#         else:
#             streamer = JSONStreamingResponse(
#                 datasets,
#                 params,
#                 pagesize=parser.defaults['pagesize'],
#                 expand_facets=util.expand_facets
#                 if expand_facets else None,
#                 callback=request.form.get('callback')
#             )
#             return streamer.response()

#     solr_browser = Browser(**params)
#     try:
#         solr_browser.execute()
#     except SolrException as e:
#         return {'errors': [unicode(e)]}

#     entries = []
#     for dataset, entry in solr_browser.get_entries():
#         entry = entry_apply_links(dataset.name, entry)
#         entry['dataset'] = dataset_apply_links(dataset.as_dict())
#         entries.append(entry)

#     if format == 'csv':
#         return write_csv(entries, filename='entries.csv')

#     if expand_facets and len(datasets) == 1:
#         facets = solr_browser.get_expanded_facets(datasets[0])
#     else:
#         facets = solr_browser.get_facets()

#     return jsonify({
#         'stats': solr_browser.get_stats(),
#         'facets': facets,
#         'results': entries
#     })
