


import logging
from datetime import datetime
import os
import json

from flask import request, g, Response, jsonify

from openspending.views.api_v3.common import blueprint

from openspending.lib.apihelper import DataBrowser

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




#slicer/<star_name>/cubes_model
# @blueprint.route("/slicer/model", methods=["JSON", "GET"])
# @api_json_errors
# @cache.cached(timeout=60, key_prefix=cache_key)
# def slicer_model():
#     cubes_arg = request.args.get("cubes", None)

#     cubes_arg = request.args.get("cubes", None)

#     try:
#         cubes = cubes_arg.split("|")
#     except:
#         raise RequestError("Parameter cubes with value  '%s'should be a valid cube names separated by a '|'"
#                 % (cubes_arg) )

#     if len (cubes) > 5:
#         raise RequestError("You can only join 5 cubes together at one time")  

@blueprint.route("/api/3/slicer/aggregate", methods=["JSON", "GET"])
@api_json_errors
#@cache.cached(timeout=60, key_prefix=cache_key)
def slicer_agg():
    d = DataBrowser()
    print "\n\n", d.selectable, "\n"
    obj = []
    for row in d._execute_query_iterator():
        obj.append(row)

    
    return json.dumps(obj)



# @blueprint.route("/api/3/slicer/<star_name>/cubes_model", methods=["JSON", "GET"])
# @requires_complex_browser
# @api_json_errors
# @cache.cached(timeout=60, key_prefix=cache_key)
# #@log_request("aggregate", "aggregates")
# def cubes_model(star_name):

#     cubes_arg = request.args.get("cubes", None)

#     try:
#         cubes = cubes_arg.split("|")
#     except:
#         raise RequestError("Parameter cubes with value  '%s'should be a valid cube names separated by a '|'"
#                 % (cubes_arg) )

#     if len (cubes) > 5:
#         raise RequestError("You can only join 5 cubes together at one time")  

#     g.cube = get_complex_cube(star_name, cubes)

#     hier_limits = None
#     # Copy from the application context
#     #g.json_record_limit = current_app.slicer.json_record_limit
#     g.json_record_limit = 10000
#     if "prettyprint" in request.args:
#         g.prettyprint = str_to_bool(request.args.get("prettyprint"))
#     else:
#         g.prettyprint = current_app.slicer.prettyprint

#     response = g.cube.to_dict(expand_dimensions=True,
#                               with_mappings=False,
#                               full_attribute_names=True,
#                               create_label=True,
#                               hierarchy_limits=hier_limits)

#     response["features"] = workspace.cube_features(g.cube)

#     return jsonify(response)



# def xlschecker(*args, **kwargs):
#     if "format" in request.args:
#         if request.args.get("format") in ['excel', 'csv']:
#             return True
#     return False

# @blueprint.route("/api/slicer/cube/<star_name>/cubes_aggregate", methods=["JSON", "GET"])
# @requires_complex_browser
# @api_json_errors
# @cache.cached(timeout=60, key_prefix=cache_key, unless=xlschecker)
# def aggregate_cubes(star_name):

#     cubes_arg = request.args.get("cubes", None)

#     try:
#         cubes = cubes_arg.split("|")
#     except:
#         raise RequestError("Parameter cubes with value  '%s'should be a valid cube names separated by a '|'"
#                 % (cubes_arg) )

#     if len (cubes) > 5:
#         raise RequestError("You can only join 5 cubes together at one time")  

#     g.cube = get_complex_cube(star_name, cubes)
    

#     g.browser = current_app.cubes_workspace.browser(g.cube)



#     cube = g.cube


#     output_format = validated_parameter(request.args, "format",
#                                         values=["json", "csv", "excel"],
#                                         default="json")

#     header_type = validated_parameter(request.args, "header",
#                                       values=["names", "labels", "none"],
#                                       default="labels")


#     fields_str = request.args.get("fields")
#     if fields_str:
#         fields = fields_str.lower().split(',')
#     else:
#         fields = None

#     # Aggregates
#     # ----------

#     aggregates = []
#     for agg in request.args.getlist("aggregates") or []:
#         aggregates += agg.split("|")

#     drilldown = []

#     ddlist = request.args.getlist("drilldown")
#     if ddlist:
#         for ddstring in ddlist:
#             drilldown += ddstring.split("|")

#     #this handles cuts with geometry__time
#     prepare_cell_cubes_ext(restrict=False)

#     prepare_cell("split", "split")


#     result = g.browser.aggregate(g.cell,
#                                  aggregates=aggregates,
#                                  drilldown=drilldown,
#                                  split=g.split,
#                                  page=g.page,
#                                  page_size=g.page_size,
#                                  order=g.order)


#     # Hide cuts that were generated internally (default: don't)
#     if current_app.slicer.hide_private_cuts:
#         result.cell = result.cell.public_cell()

#     # Copy from the application context
#     #g.json_record_limit = current_app.slicer.json_record_limit
#     g.json_record_limit = 10000
#     if "prettyprint" in request.args:
#         g.prettyprint = str_to_bool(request.args.get("prettyprint"))
#     else:
#         g.prettyprint = current_app.slicer.prettyprint





#     if output_format == "json":
#         resultdict= result.to_dict()
#         tempcells = list(result._cells)
#         resultdict['cells'] = tempcells
#         resultdict['cell'] = list(resultdict['cell'])
#         if "cluster" in request.args:
#             clusteragg = request.args.get('clusteragg', 'avg')
#             if len(cubes) > 1 or len(cubes) < 1:
#                 log.warn("cluster must have one and only one cube.  This call had %s"%str(cubes))
#             if clusteragg in ['avg', 'min', 'max', 'sum']:
#                 clusterfield = "%s__amount_%s"%(cubes[0], clusteragg,) 
#             numclusters = request.args.get('numclusters',5)
#             tempresult = get_cubes_breaks(resultdict['cells'], clusterfield, method=request.args.get('cluster'), k=numclusters)
#             tempresult['data'] = list(tempresult['data'])
#             resultdict.set('cluster', tempresult)      
#         resp = Response(response=json.dumps(resultdict),
#             status=200, \
#             mimetype="application/json")
#         return(resp)

#     elif output_format not in  ["csv","excel"]:
#         raise RequestError("unknown response format '%s'" % output_format)

#     # csv
#     if header_type == "names":
#         header = result.labels
#     elif header_type == "labels":
#         header = []
#         for l in result.labels:
#             # TODO: add a little bit of polish to this
#             if l == SPLIT_DIMENSION_NAME:
#                 header.append('Matches Filters')
#             else:
#                 header += [ attr.label or attr.name for attr in cube.get_attributes([l], aggregated=True) ]
#     else:
#         header = None

#     fields = result.labels

    
#     try:
#         filename_output = cubes[0] + "_" + datetime.now().strftime("%Y-%m-%d")
#     except:
#         filename_output = "aggregate_" + datetime


#     if output_format == "excel":
#         output_string = xls_generator(result,
#                                  fields,
#                                  include_header=bool(header),
#                                  header=header)
#         headers = {"Content-Disposition": 'attachment; filename="' + filename_output + '.xlsx"'}
#         return Response(output_string,
#                         mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
#                         headers=headers)
#     else:

#         generator = csv_generator(result,
#                                  fields,
#                                  include_header=bool(header),
#                                  header=header)
        
#         headers = {"Content-Disposition": 'attachment; filename="' + filename_output + '.csv"'}
#         return Response(generator,
#                         mimetype='text/csv',
#                         headers=headers)


# @blueprint.route("/api/slicer/cube/<star_name>/cubes_facts", methods=["JSON", "GET"])
# @requires_complex_browser
# @api_json_errors
# @cache.cached(timeout=60, key_prefix=cache_key)
# #@log_request("facts", "fields")
# def cubes_facts(star_name):
#     cubes_arg = request.args.get("cubes", None)

#     try:
#         cubes = cubes_arg.split("|")
#     except:
#         raise RequestError("Parameter cubes with value  '%s'should be a valid cube names separated by a '|'"
#                 % (cubes_arg) )

#     if len (cubes) > 5:
#         raise RequestError("You can only join 5 cubes together at one time")  

#     g.cube = get_complex_cube(star_name, cubes)
    

#     g.browser = current_app.cubes_workspace.browser(g.cube)

#     # Copy from the application context
#     g.json_record_limit = current_app.slicer.json_record_limit
#     if "prettyprint" in request.args:
#         g.prettyprint = str_to_bool(request.args.get("prettyprint"))
#     else:
#         g.prettyprint = current_app.slicer.prettyprint


#     # Request parameters
#     fields_str = request.args.get("fields")
#     if fields_str:
#         fields = fields_str.split(',')
#     else:
#         fields = None

#     # fields contain attribute names
#     if fields:
#         attributes = g.cube.get_attributes(fields)
#     else:
#         attributes = g.cube.all_attributes

#     # Construct the field list
#     fields = [attr.ref() for attr in attributes]

#     # Get the result
#     facts = g.browser.facts(g.cell,
#                              fields=fields,
#                              order=g.order,
#                              page=g.page,
#                              page_size=g.page_size)

#     # Add cube key to the fields (it is returned in the result)
#     fields.insert(0, g.cube.key or "id")

#     # Construct the header
#     labels = [attr.label or attr.name for attr in attributes]
#     labels.insert(0, g.cube.key or "id")

#     return formated_response(facts, fields, labels)


