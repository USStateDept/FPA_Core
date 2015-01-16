import logging

from flask import request, g

from openspending.core import cache
from openspending.auth import require
from openspending.lib.util import cache_hash
from openspending.lib.jsonexport import jsonify
from openspending.lib.csvexport import write_csv
from openspending.lib.paramparser import AggregateParamParser
from openspending.inflation.aggregation import aggregate as inf_aggregate
from openspending.lib.hypermedia import drilldowns_apply_links
from openspending.views.cache import etag_cache_keygen
from openspending.views.api_v2.common import blueprint

from openspending.lib.cubes_util import *
from cubes.server.utils import *
from cubes.server.decorators import prepare_cell




log = logging.getLogger(__name__)


@blueprint.route("/api/slicer/cube/<star_name>/cubes_model", methods=["JSON", "GET"])
@requires_complex_browser
#@log_request("aggregate", "aggregates")
def cubes_model(star_name):

    cubes_arg = request.args.get("cubes", None)

    try:
        cubes = cubes_arg.split("|")
    except:
        raise RequestError("Parameter cubes with value  '%s'should be a valid cube names separated by a '|'"
                % (cubes_arg) )

    if len (cubes) > 5:
        raise RequestError("You can only join 5 cubes together at one time")  

    g.cube = get_complex_cube(star_name, cubes)

    hier_limits = None
    # Copy from the application context
    g.json_record_limit = current_app.slicer.json_record_limit
    if "prettyprint" in request.args:
        g.prettyprint = str_to_bool(request.args.get("prettyprint"))
    else:
        g.prettyprint = current_app.slicer.prettyprint

    response = g.cube.to_dict(expand_dimensions=True,
                              with_mappings=False,
                              full_attribute_names=True,
                              create_label=True,
                              hierarchy_limits=hier_limits)

    response["features"] = workspace.cube_features(g.cube)

    return jsonify(response)



@blueprint.route("/api/slicer/cube/<star_name>/cubes_aggregate", methods=["JSON", "GET"])
@requires_complex_browser
#@log_request("aggregate", "aggregates")
def aggregate_cubes(star_name):

    cubes_arg = request.args.get("cubes", None)

    try:
        cubes = cubes_arg.split("|")
    except:
        raise RequestError("Parameter cubes with value  '%s'should be a valid cube names separated by a '|'"
                % (cubes_arg) )

    if len (cubes) > 5:
        raise RequestError("You can only join 5 cubes together at one time")  

    g.cube = get_complex_cube(star_name, cubes)
    

    g.browser = current_app.cubes_workspace.browser(g.cube)



    cube = g.cube

    output_format = validated_parameter(request.args, "format",
                                        values=["json", "csv"],
                                        default="json")

    header_type = validated_parameter(request.args, "header",
                                      values=["names", "labels", "none"],
                                      default="labels")

    fields_str = request.args.get("fields")
    if fields_str:
        fields = fields_str.lower().split(',')
    else:
        fields = None

    # Aggregates
    # ----------

    aggregates = []
    for agg in request.args.getlist("aggregates") or []:
        aggregates += agg.split("|")

    drilldown = []

    ddlist = request.args.getlist("drilldown")
    if ddlist:
        for ddstring in ddlist:
            drilldown += ddstring.split("|")


    prepare_cell(restrict=False)

    prepare_cell("split", "split")


    result = g.browser.aggregate(g.cell,
                                 aggregates=aggregates,
                                 drilldown=drilldown,
                                 split=g.split,
                                 page=g.page,
                                 page_size=g.page_size,
                                 order=g.order)

    # Hide cuts that were generated internally (default: don't)
    if current_app.slicer.hide_private_cuts:
        result.cell = result.cell.public_cell()

    # Copy from the application context
    g.json_record_limit = current_app.slicer.json_record_limit
    if "prettyprint" in request.args:
        g.prettyprint = str_to_bool(request.args.get("prettyprint"))
    else:
        g.prettyprint = current_app.slicer.prettyprint


    if output_format == "json":
        return jsonify(result)
    elif output_format != "csv":
        raise RequestError("unknown response format '%s'" % output_format)

    # csv
    if header_type == "names":
        header = result.labels
    elif header_type == "labels":
        header = []
        for l in result.labels:
            # TODO: add a little bit of polish to this
            if l == SPLIT_DIMENSION_NAME:
                header.append('Matches Filters')
            else:
                header += [ attr.label or attr.name for attr in cube.get_attributes([l], aggregated=True) ]
    else:
        header = None

    fields = result.labels
    generator = CSVGenerator(result,
                             fields,
                             include_header=bool(header),
                             header=header)

    headers = {"Content-Disposition": 'attachment; filename="aggregate.csv"'}
    return Response(generator.csvrows(),
                    mimetype='text/csv',
                    headers=headers)


@blueprint.route("/api/slicer/cube/<star_name>/cubes_facts", methods=["JSON", "GET"])
@requires_complex_browser
#@log_request("facts", "fields")
def cubes_facts(star_name):
    cubes_arg = request.args.get("cubes", None)

    try:
        cubes = cubes_arg.split("|")
    except:
        raise RequestError("Parameter cubes with value  '%s'should be a valid cube names separated by a '|'"
                % (cubes_arg) )

    if len (cubes) > 5:
        raise RequestError("You can only join 5 cubes together at one time")  

    g.cube = get_complex_cube(star_name, cubes)
    

    g.browser = current_app.cubes_workspace.browser(g.cube)

    # Copy from the application context
    g.json_record_limit = current_app.slicer.json_record_limit
    if "prettyprint" in request.args:
        g.prettyprint = str_to_bool(request.args.get("prettyprint"))
    else:
        g.prettyprint = current_app.slicer.prettyprint


    # Request parameters
    fields_str = request.args.get("fields")
    if fields_str:
        fields = fields_str.split(',')
    else:
        fields = None

    # fields contain attribute names
    if fields:
        attributes = g.cube.get_attributes(fields)
    else:
        attributes = g.cube.all_attributes

    # Construct the field list
    fields = [attr.ref() for attr in attributes]

    # Get the result
    facts = g.browser.facts(g.cell,
                             fields=fields,
                             order=g.order,
                             page=g.page,
                             page_size=g.page_size)

    # Add cube key to the fields (it is returned in the result)
    fields.insert(0, g.cube.key or "id")

    # Construct the header
    labels = [attr.label or attr.name for attr in attributes]
    labels.insert(0, g.cube.key or "id")

    return formated_response(facts, fields, labels)


