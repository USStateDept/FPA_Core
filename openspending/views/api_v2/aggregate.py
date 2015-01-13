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
from cubes.model import Cube
from cubes.server.decorators import prepare_cell




log = logging.getLogger(__name__)


@cache.memoize()
def cached_aggregate(dataset, measures=['amount'], drilldowns=None, cuts=None,
                     page=1, pagesize=10000, order=None, inflate=None):
    """ A proxy object to run cached calls against the dataset
    aggregation function. This is neither a concern of the data
    model itself, nor should it be repeated at each location
    where caching of aggregates should occur - thus it ends up
    here.
    For call docs, see ``model.Dataset.aggregate``. """
    return inf_aggregate(dataset, measures=measures,
                         drilldowns=drilldowns, cuts=cuts,
                         page=page, pagesize=pagesize,
                         order=order, inflate=inflate)

cached_aggregate.make_cache_key = cache_hash


@blueprint.route('/api/2/aggregate')
def aggregate():
    """
    Aggregation of a dataset based on URL parameters. It serves the
    aggregation from a cache if possible, and if not it computes it (it's
    performed in the aggregation cache for some reason).
    """

    # Parse the aggregation parameters to get them into the right format
    parser = AggregateParamParser(request.args)
    params, errors = parser.parse()

    # If there were parsing errors we return them with status code 400
    # as jsonp, irrespective of what format was asked for.
    if errors:
        return jsonify({'errors': errors}, status=400)

    # URL parameters are always singular nouns but we work with some
    # as plural nouns so we pop them into the plural version
    params['cuts'] = params.pop('cut')
    params['drilldowns'] = params.pop('drilldown')
    params['measures'] = params.pop('measure')

    # Get the dataset and the format and remove from the parameters
    dataset = params.pop('dataset')
    format = params.pop('format')

    # User must have the right to read the dataset to perform aggregation
    require.dataset.read(dataset)

    try:
        # Create an aggregation cache for the dataset and aggregate its
        # results. The cache will perform the aggreagation if it doesn't
        # have a cached result.
        result = cached_aggregate(dataset, **params)

        # If the result has drilldown we create html_url values for its
        # dimensions (linked data).
        if 'drilldown' in result:
            result['drilldown'] = drilldowns_apply_links(
                dataset.name, result['drilldown'])

        # Do the ETag caching based on the cache_key in the summary
        # this is a weird place to do it since the heavy lifting has
        # already been performed above. TODO: Needs rethinking.
        etag_cache_keygen(dataset)

    except (KeyError, ValueError) as ve:
        # We log possible errors and return them with status code 400
        log.exception(ve)
        return jsonify({'errors': [unicode(ve)]}, status=400)

    # If the requested format is csv we write the drilldown results into
    # a csv file and return it, if not we return a jsonp result (default)
    if format == 'csv':
        return write_csv(result['drilldown'], filename=dataset.name + '.csv')
    return jsonify(result)


@blueprint.route("/api/slicer/cube/<star_name>/cubes_aggregate")
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



    #skipping authorization without "authorized_cube" func
    #the workspace.cube function will raiseerror if cube is not found
    star_cube_raw = current_app.cubes_workspace.cube(star_name, locale=g.locale, metaonly=True)
    star_cube = add_table_identifier(star_cube_raw, seperator="__")


    cubes_meta = []
    for cube_name in cubes:
        if cube_name:
            cube_joiner_meta_raw = current_app.cubes_workspace.cube(cube_name, locale=g.locale, metaonly=True)
            cube_joiner_meta = add_table_identifier(cube_joiner_meta_raw, seperator="__")
            cubes_meta.append(cube_joiner_meta)
    
    star_cube = coalesce_cubes(star_cube, cubes_meta)


    g.cube = Cube(name=star_cube['name'],
                            fact=star_cube['fact'],
                            aggregates=star_cube['aggregates'],
                            measures=star_cube['measures'],
                            label=star_cube['label'],
                            description=star_cube['description'],
                            dimensions=star_cube['dimensions'],
                            store=star_cube['store'],
                            mappings=star_cube['mappings'],
                            joins=star_cube['joins'])
    

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


