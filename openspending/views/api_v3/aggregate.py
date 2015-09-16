


import logging
from datetime import datetime
import os


from flask import request, g, Response, jsonify

from openspending.views.api_v3.common import blueprint

from openspending.lib.apihelper import DataBrowser, GEO_MAPPING,FORMATOPTS
from openspending.lib.jsonexport import to_json
from openspending.lib.helpers import get_dataset

# #from openspending.core import cache
# from openspending.auth import require
# from openspending.lib.jsonexport import jsonify
from openspending.views.error import api_json_errors

# #imports prepare_cell_cubes_ext
# from openspending.lib.cubes_util import *
# from openspending.lib.cache import cache_key
# from openspending.core import cache
# from cubes.server.utils import *
# from cubes.formatters import JSONLinesGenerator, csv_generator, xls_generator
# from cubes.browser import SPLIT_DIMENSION_NAME
# from cubes.server.decorators import prepare_cell



log = logging.getLogger(__name__)



@blueprint.route("/api/3/slicer/aggregate", methods=["JSON", "GET"])
@api_json_errors
#@cache.cached(timeout=60, key_prefix=cache_key)
def slicer_agg():
    d = DataBrowser()
    return d.get_response()


@blueprint.route("/api/3/slicer/model", methods=["JSON", "GET"])
@api_json_errors
#@cache.cached(timeout=60, key_prefix=cache_key)
def slicer_model():
    #options
    #get dataset info
    results = {
        "models": {},
        "options": {}
    }
    cubesarg = request.args.get("cubes", [])
    cubes = cubesarg.split("|")
    for cube in cubes:
        dataset = get_dataset(cube)
        if dataset:
            results['models'][cube] = dataset.detailed_dict()

    results['options'] = GEO_MAPPING

    results['formats']= FORMATOPTS


    resp = Response(response=to_json(results),
            status=200, \
            mimetype="application/json")
    return resp
