# -*- coding: utf-8 -*-
from flask import request, g, current_app
from functools import wraps

import numpy as np
from pysal.esda import mapclassify

from cubes.workspace import Workspace
from cubes.auth import NotAuthorized
from cubes.errors import *
from cubes.cells import cuts_from_string, Cell, cut_from_dict
from cubes.server.utils import *
from cubes.server.errors import *
from cubes.server.local import *
from cubes.server.decorators import prepare_cell
from cubes.calendar import CalendarMemberConverter
from cubes.model import Cube, Dimension

from contextlib import contextmanager

DEFAULT_TIMECUT = "geometry__time:1990-2015"



def get_cubes_breaks(vals, field, method='jenks', k=5):
    """
    input
        vals - dict vals with float
        field - field to grab values
        method - method should be jenks, quantil, equal
        k - number of classes
    output
        the bounds of each of the classes with labels
    """
    arrayvals = np.array([x[field] for x in vals])
    arrayvals = arrayvals[arrayvals != np.array(None)]
    if len(arrayvals) == 0:
        return {"labels":[],"data":[]}
    k = int(k)
    if len(arrayvals) < k:
        k= len(arrayvals)
    classreturn = []
    if method=='equal':
        classreturn = mapclassify.Equal_Interval(arrayvals, k=k).bins
    elif method == 'quantil':
        classreturn = mapclassify.Quantiles(arrayvals, k=k).bins
    else:
        classreturn = mapclassify.Fisher_Jenks(arrayvals, k=k).bins
    returnset = {}
    classreturn= np.insert(classreturn, 0, arrayvals.min())
    returnset['data'] = [x for x in classreturn]
    returnset['labels'] = []
    for ind in range(len(classreturn)):
        if ind == len(classreturn) -1:
            #returnset['labels'].append("%s - %s"%(classreturn[ind],classreturn[ind+1]))
            break
        returnset['labels'].append("%s - %s"%(classreturn[ind],classreturn[ind+1]))
    return returnset
  


def prepare_cell_cubes_ext(argname="cut", target="cell", restrict=False):
    """Sets `g.cell` with a `Cell` object from argument with name `argname`"""
    # Used by prepare_browser_request and in /aggregate for the split cell


    # TODO: experimental code, for now only for dims with time role
    converters = {
        "time": CalendarMemberConverter(workspace.calendar)
    }


    #if geometry__time not in cuts, then add default date range
    #has geometry__time
    has_geom_time = False
    cuts = []
    for cut_string in request.args.getlist(argname):
      try:
        if cut_string.split(":")[0] == "geometry__time":
          has_geom_time = True
      except:
        pass

      cuts += cuts_from_string(g.cube, cut_string,
                                   role_member_converters=converters)

    if not has_geom_time:
        #add the time cut by default
        cuts += cuts_from_string(g.cube, DEFAULT_TIMECUT,
                             role_member_converters=converters)


    if cuts:
        cell = Cell(g.cube, cuts)
    else:
        cell = None

    if restrict:
        if workspace.authorizer:
            cell = workspace.authorizer.restricted_cell(g.auth_identity,
                                                        cube=g.cube,
                                                        cell=cell)
    setattr(g, target, cell)

                              



def requires_complex_browser(f):
    """Prepares three global variables: `g.cube`, `g.browser` and `g.cell`.
    Also athorizes the cube using `authorize()`."""

    @wraps(f)
    def wrapper(*args, **kwargs):

        star_name = request.view_args.get("star_name")
        g.star_name = star_name


        if "lang" in request.args:
            g.locale = request.args.get("lang")
        else:
            g.locale = None


        #prepare_cell(restrict=False)


        if "page" in request.args:
            try:
                g.page = int(request.args.get("page"))
            except ValueError:
                raise RequestError("'page' should be a number")
        else:
            g.page = None

        if "pagesize" in request.args:
            try:
                g.page_size = int(request.args.get("pagesize"))
            except ValueError:
                raise RequestError("'pagesize' should be a number")
        else:
            g.page_size = None

        # Collect orderings:
        # order is specified as order=<field>[:<direction>]
        #
        g.order = []
        for orders in request.args.getlist("order"):
            for order in orders.split(","):
                split = order.split(":")
                if len(split) == 1:
                    g.order.append( (order, None) )
                else:
                    g.order.append( (split[0], split[1]) )

        return f(*args, **kwargs)

    return wrapper

def get_complex_cube(star_name, cubes):

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

    return Cube(name=star_cube['name'],
                            fact=star_cube['fact'],
                            aggregates=star_cube['aggregates'],
                            measures=star_cube['measures'],
                            label=star_cube['label'],
                            description=star_cube['description'],
                            dimensions=star_cube['dimensions'],
                            store=star_cube['store'],
                            mappings=star_cube['mappings'],
                            joins=star_cube['joins'])


def figure_out_deps(masterjoin, rightjointable):
    #makes sure all the deps are in the right order
    finaljoins = []
    tempmaster = []
    for t in range(len(masterjoin)):
        if masterjoin[t]['detail'].split('.')[0] == rightjointable:
            finaljoins.append({'master':masterjoin[t]['detail'], 'detail':masterjoin[t]['master']})
        else:
            tempmaster.append(masterjoin[t])

    #repeat until all tempmasters are popped
    while (len(tempmaster) >0):
        mypops = []
        #look at all of the tempmasters available
        for j in range(len(tempmaster)):
            #if finaljoins doesn't have anything in it then check tempmaster for those that don't have deailts
            no_master = True
            for z in range(len(tempmaster)):
                if tempmaster[z]['detail'].split('.')[0] == tempmaster[j]['master'].split('.')[0]:
                    no_master = False
            if no_master:
                mypops.append(j)
        newlist = []
        for p in range(len(tempmaster)):
            if p in mypops:
                finaljoins.append(tempmaster[p])
            else:
                newlist.append(tempmaster[p])
        tempmaster = newlist



    return finaljoins



def sort_on_deps(joinslist, detail_table):

    #find the instance of this detail table in master and move it to the top

    theindex = -1
    for j in range(len(joinslist)):
        if joinslist[j]['detail'].split(".")[0] == detail_table:
            theindex = j
            continue
    keyjoin = {'master': joinslist[theindex]['detail'], 'detail':joinslist[theindex]['master']}
    joinslist.pop(theindex)
    joinslist.insert(0, keyjoin)
    return joinslist

def add_table_identifier(meta_data, seperator="__"):
    for item in ['aggregates', 'measures', 'dimensions']:

        for dim in meta_data[item]:
            try:
                if dim.ref == "num_entries":
                    continue
            except:
                pass
            dim.name = meta_data['name'] + seperator + dim.name
            if item == 'measures':
                dim.ref = meta_data['name'] + seperator + dim.ref
            elif hasattr(dim, 'attributes'):
                for attr in dim.attributes:
                    if attr.ref == "geom_time_id":
                        attr.ref = meta_data['name'] + seperator + "entry." +  attr.ref
                    else:
                        attr.ref = meta_data['name'] + seperator + attr.ref
            elif item == 'aggregates':
                dim.measure = meta_data['name'] + seperator + dim.measure
                dim.ref = meta_data['name'] + seperator + dim.ref
            else:
                print "Could not find the type of dimension"

    master_meta_new = {}
    for mapkey in meta_data['mappings']:
       master_meta_new[meta_data['name'] + "__" + mapkey] = meta_data['mappings'][mapkey]
    meta_data['mappings'] = master_meta_new

    meta_data['mappings'][meta_data['name'] + '__amount'] = meta_data['name'] + '__entry.amount'

    meta_data['mappings'].update(meta_data['mappings'])


    return meta_data


#drill down example using hierarchies little documentation in cubes!
#http://localhost:5000/api/slicer/cube/test_geom/aggregate?aggregates=test_geom__amount&drilldown=test_geom__time@monthly:month&cut=test_geom__time.year:2010

def coalesce_cubes(master_meta, cubes_metadata):
    #join on lowest geographical hierarchy across all loaded finge cubes
    #join on year field


    #search for "Country_level0" or country_level0 or any other labels we might apply in case not consistent in data loading
    #before we do amny edits to the master_meta
    candidates = ["year.id", "time.id", 'geom_time_id.geom_time_id']
    leftjoin_field = None
    for joinfield in master_meta['dimensions']:
        if joinfield.name.split('__')[1] + ".id" in candidates:
            leftjoin_field = joinfield.name+ ".id" 
            break

    has_num_entries = False

    for cube_meta in cubes_metadata:
        rightjoin_field = None
        for joinfield2 in cube_meta['dimensions']:
            if joinfield2.name.split('__')[1] + ".geom_time_id" in candidates:
                rightjoin_field = joinfield2.name.split('__')[0] + "__entry.geom_time_id" 
                break

        if not rightjoin_field:
            raise RequestError("Could not find join value for '%s'and '%s'.  Checked %s"
                    % (master_meta['name'], cube_meta['name'], candidates) )


        #add in all of the components to the master_meta
        for item in ['aggregates', 'measures', 'dimensions']:
            #let's take out the country_level0 one
            if item == 'aggregates':
                #remove num_entries for this
                for aggitem_index in range(len(cube_meta[item])):
                    if cube_meta[item][aggitem_index].name == "num_entries":
                        if has_num_entries:
                            cube_meta[item].pop(aggitem_index)
                        else:
                            has_num_entries = True
                        break

            master_meta[item] = master_meta[item] + cube_meta[item]

        master_meta['mappings'].update(cube_meta['mappings'])


        #join_dict example {"master": "test_geom__Country_level0.label", "detail":"geometry__country_level0.label"}
        master_meta['joins']  = master_meta['joins'] + \
            [{"master": leftjoin_field, "detail":rightjoin_field, "method": "master"}] + \
            figure_out_deps(cube_meta['joins'], rightjoin_field.split(".")[0])



    #master_meta['joins'] = figure_out_deps(master_meta['joins'])
    master_meta['joins'] = master_meta['joins'][::-1]


    return master_meta




def getGeomCube(provider, metaonly):


    basemeta = {
                  "name": "geometry",
                  "info": {},
                  "label": "Base Geometry",
                  'fact_table': "geometry__time",
                  "description": "The Base Geometry Table",
                  "aggregates": [],
                  "measures": [],
                  "details": []
                }

    dim_metas = [
                    {
                      "name": "time",
                      "info": {},
                      "label": "Year",
                      "default_hierarchy_name": "time",
                      "levels": [
                        {
                          "name": "time",
                          "info": {},
                          "label": "Year",
                          "key": "time",
                          "label_attribute": "time",
                          "order_attribute": "time",
                          "attributes": [
                            {
                              "name": "time",
                              "info": {},
                              "label": "Year",
                              "ref": "geometry__time.time",
                              "locales": []
                            }
                          ]
                        }
                        ],
                      "hierarchies": [
                        {
                          "name": "time",
                          "info": {},
                          "label": "Year",
                          "levels": [
                            "time"
                          ]
                        }, 
                      ],
                      "is_flat": False,
                      "has_details": False
                    },
                    {
                      "name": "country_level0",
                      "info": {},
                      "label": "Country Name (lower case)",
                      "default_hierarchy_name": "name",
                      "levels": [
                        {
                          "name": "name",
                          "info": {},
                          "label": "Country Name",
                          "key": "name",
                          "label_attribute": "name",
                          "order_attribute": "name",
                          "attributes": [
                            {
                              "name": "name",
                              "info": {},
                              "label": "Country Name",
                              "ref": "geometry__country_level0.name",
                              "locales": []
                            }
                          ]
                        },
                        {
                          "name": "continent",
                          "info": {},
                          "label": "Continents Countries",
                          "key": "continent",
                          "label_attribute": "continent",
                          "order_attribute": "continent",
                          "attributes": [
                            {
                              "name": "continent",
                              "info": {},
                              "label": "Continents Country",
                              "ref": "geometry__country_level0.continent",
                              "locales": []
                            }
                          ]
                        },
                        {
                          "name": "dos_region",
                          "info": {},
                          "label": "Department of State Countries",
                          "key": "dos_region",
                          "label_attribute": "dos_region",
                          "order_attribute": "dos_region",
                          "attributes": [
                            {
                              "name": "dos_region",
                              "info": {},
                              "label": "Department of State Country",
                              "ref": "geometry__country_level0.dos_region",
                              "locales": []
                            }
                          ]
                        },
                        {
                          "name": "dod_cmd",
                          "info": {},
                          "label": "Department of Defense Country",
                          "key": "dod_cmd",
                          "label_attribute": "dod_cmd",
                          "order_attribute": "dod_cmd",
                          "attributes": [
                            {
                              "name": "dod_cmd",
                              "info": {},
                              "label": "Department of Defense Country",
                              "ref": "geometry__country_level0.dod_cmd",
                              "locales": []
                            }
                          ]
                        },
                        {
                          "name": "usaid_reg",
                          "info": {},
                          "label": "USAID Countries",
                          "key": "usaid_reg",
                          "label_attribute": "usaid_reg",
                          "order_attribute": "usaid_reg",
                          "attributes": [
                            {
                              "name": "usaid_reg",
                              "info": {},
                              "label": "USAID Countries",
                              "ref": "geometry__country_level0.usaid_reg",
                              "locales": []
                            }
                          ]
                        },  
                        {
                          "name": "feed_the_f",
                          "info": {},
                          "label": "Feed the Future Countries",
                          "key": "feed_the_f",
                          "label_attribute": "feed_the_f",
                          "order_attribute": "feed_the_f",
                          "attributes": [
                            {
                              "name": "feed_the_f",
                              "info": {},
                              "label": "Feed the Future Countries",
                              "ref": "geometry__country_level0.feed_the_f",
                              "locales": []
                            }
                          ]
                        },
                        {
                          "name": "pepfar",
                          "info": {},
                          "label": "PEPFAR Countries",
                          "key": "pepfar",
                          "label_attribute": "pepfar",
                          "order_attribute": "pepfar",
                          "attributes": [
                            {
                              "name": "pepfar",
                              "info": {},
                              "label": "PEPFAR Countries",
                              "ref": "geometry__country_level0.pepfar",
                              "locales": []
                            }
                          ]
                        },
                        {
                          "name": "paf",
                          "info": {},
                          "label": "PAF Countries",
                          "key": "paf",
                          "label_attribute": "paf",
                          "order_attribute": "paf",
                          "attributes": [
                            {
                              "name": "paf",
                              "info": {},
                              "label": "PAF Countries",
                              "ref": "geometry__country_level0.paf",
                              "locales": []
                            }
                          ]
                        },
                        {
                          "name": "oecd",
                          "info": {},
                          "label": "OECD Countries",
                          "key": "oecd",
                          "label_attribute": "oecd",
                          "order_attribute": "oecd",
                          "attributes": [
                            {
                              "name": "oecd",
                              "info": {},
                              "label": "OECD Countries",
                              "ref": "geometry__country_level0.oecd",
                              "locales": []
                            }
                          ]
                        },
                        {
                          "name": "region_un",
                          "info": {},
                          "label": "UN Region Countries",
                          "key": "region_un",
                          "label_attribute": "region_un",
                          "order_attribute": "region_un",
                          "attributes": [
                            {
                              "name": "region_un",
                              "info": {},
                              "label": "UN Region Countries",
                              "ref": "geometry__country_level0.region_un",
                              "locales": []
                            }
                          ]
                        },
                        {
                          "name": "subregion",
                          "info": {},
                          "label": "Subregion Countries",
                          "key": "subregion",
                          "label_attribute": "subregion",
                          "order_attribute": "subregion",
                          "attributes": [
                            {
                              "name": "subregion",
                              "info": {},
                              "label": "Subregion Countries",
                              "ref": "geometry__country_level0.subregion",
                              "locales": []
                            }
                          ]
                        },
                        {
                          "name": "region_wb",
                          "info": {},
                          "label": "World Bank Region Countries",
                          "key": "region_wb",
                          "label_attribute": "region_wb",
                          "order_attribute": "region_wb",
                          "attributes": [
                            {
                              "name": "region_wb",
                              "info": {},
                              "label": "World Bank Region Countries",
                              "ref": "geometry__country_level0.region_wb",
                              "locales": []
                            }
                          ]
                        },
                        {
                          "name": "wb_inc_lvl",
                          "info": {},
                          "label": "World Bank Income Level Countries",
                          "key": "wb_inc_lvl",
                          "label_attribute": "wb_inc_lvl",
                          "order_attribute": "wb_inc_lvl",
                          "attributes": [
                            {
                              "name": "wb_inc_lvl",
                              "info": {},
                              "label": "World Bank Income Level Countries",
                              "ref": "geometry__country_level0.wb_inc_lvl",
                              "locales": []
                            }
                          ]
                        },
                        {
                          "name": "sovereignt",
                          "info": {},
                          "label": "Sovereignty",
                          "key": "sovereignt",
                          "label_attribute": "sovereignt",
                          "order_attribute": "sovereignt",
                          "attributes": [
                            {
                              "name": "sovereignt",
                              "info": {},
                              "label": "Sovereignty",
                              "ref": "geometry__country_level0.sovereignt",
                              "locales": []
                            }
                          ]
                        } 
                      ],
                      "hierarchies": [
                        {
                          "name": "name",
                          "info": {},
                          "label": "Country Name",
                          "levels": [
                            "name"
                          ]
                        },                        
                        {
                          "name": "sovereignt",
                          "info": {},
                          "label": "Sovereignty",
                          "levels": [
                            "sovereignt",
                            "name"
                          ]
                        },
                        {
                          "name": "dos_region",
                          "info": {},
                          "label": "Department of State Regions",
                          "levels": [
                            "dos_region",
                            "sovereignt",
                            "name"
                          ]
                        },
                        {
                          "name": "usaid_reg",
                          "info": {},
                          "label": "USAID Regions",
                          "levels": [
                            "usaid_reg",
                            "sovereignt",
                            "name"
                          ]
                        },
                        {
                          "name": "dod_cmd",
                          "info": {},
                          "label": "Department of Defense Regions",
                          "levels": [
                            "dod_cmd",
                            "sovereignt",
                            "name"
                          ]
                        },
                        {
                          "name": "feed_the_f",
                          "info": {},
                          "label": "Feed the Future Regions",
                          "levels": [
                            "feed_the_f",
                            "sovereignt",
                            "name"
                          ]
                        },
                        {
                          "name": "pepfar",
                          "info": {},
                          "label": "PEPFAR Regions",
                          "levels": [
                            "pepfar",
                            "sovereignt",
                            "name"
                          ]
                        },
                        {
                          "name": "paf",
                          "info": {},
                          "label": "PAF Regions",
                          "levels": [
                            "paf",
                            "sovereignt",
                            "name"
                          ]
                        },
                        {
                          "name": "oecd",
                          "info": {},
                          "label": "OECD Regions",
                          "levels": [
                            "oecd",
                            "sovereignt",
                            "name"
                          ]
                        },
                        {
                          "name": "region_un",
                          "info": {},
                          "label": "United Nation Regions",
                          "levels": [
                            "region_un",
                            "sovereignt",
                            "name"
                          ]
                        },
                        {
                          "name": "subregion",
                          "info": {},
                          "label": "Subregions",
                          "levels": [
                            "subregion",
                            "sovereignt",
                            "name"
                          ]
                        },
                        {
                          "name": "region_wb",
                          "info": {},
                          "label": "World Bank Regions",
                          "levels": [
                            "region_wb",
                            "sovereignt",
                            "name"
                          ]
                        },
                        {
                          "name": "wb_inc_lvl",
                          "info": {},
                          "label": "World Bank Income Level Regions",
                          "levels": [
                            "wb_inc_lvl",
                            "sovereignt",
                            "name"
                          ]
                        },                        
                        {
                          "name": "continent",
                          "info": {},
                          "label": "Continents",
                          "levels": [
                            "continent",
                            "sovereignt",
                            "name"
                          ]
                        }
                      ],
                      "is_flat": False,
                      "has_details": False
                    }
                  ]



    joins = [{"master": u"geometry__time.gid", "detail": u"geometry__country_level0.gid"}] 
    #joins = []
    mappings = {
                u'time.year' : u"geometry__time.year",
                u'geometry__year' : u"geometry__time.year",
                u"time.id" : u"geometry__time.id",
                u"time.gid" : u"geometry__time.gid",
                u"country_level0.continent": u"geometry__country_level0.continent",
                u"country_level0.dos_region": u"geometry__country_level0.dos_region",
                u"country_level0.usaid_reg": u"geometry__country_level0.usaid_reg", 
                u"country_level0.dod_cmd": u"geometry__country_level0.dod_cmd", 
                u"country_level0.feed_the_f": u"geometry__country_level0.feed_the_f",
                u"country_level0.pepfar": u"geometry__country_level0.pepfar",
                u"country_level0.paf": u"geometry__country_level0.paf",
                u"country_level0.oecd": u"geometry__country_level0.oecd",
                u"country_level0.region_un": u"geometry__country_level0.region_un",
                u"country_level0.subregion": u"geometry__country_level0.subregion",
                u"country_level0.region_wb": u"geometry__country_level0.region_wb",
                u"country_level0.wb_inc_lvl": u"geometry__country_level0.wb_inc_lvl",
                u"country_level0.id": u"geometry__country_level0.id",
                u"country_level0.name": u"geometry__country_level0.name",
                u"country_level0.label": u"geometry__country_level0.label"
            } 

    dimensions = []
    for dim in dim_metas:
        dimensions.append(Dimension.from_metadata(dim))



    cube_meta = {"name":basemeta['name'],
                            "fact":basemeta['fact_table'],
                            "aggregates":basemeta['aggregates'],
                            "measures":basemeta['measures'],
                            "label":basemeta['label'],
                            "description":basemeta['description'],
                            "dimensions":dimensions,
                            "store":provider.store,
                            "mappings":mappings,
                            "joins":joins}

    if metaonly:
        return cube_meta
    else:
        return Cube(name=cube_meta['name'],
                        fact=cube_meta['fact'],
                        aggregates=cube_meta['aggregates'],
                        measures=cube_meta['measures'],
                        label=cube_meta['label'],
                        description=cube_meta['description'],
                        dimensions=cube_meta['dimensions'],
                        store=cube_meta['store'],
                        mappings=cube_meta['mappings'],
                        joins=cube_meta['joins'])



