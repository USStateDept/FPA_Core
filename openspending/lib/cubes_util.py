# -*- coding: utf-8 -*-
from flask import Blueprint, Flask, Response, request, g, current_app
from functools import wraps

from cubes.workspace import Workspace
from cubes.auth import NotAuthorized
from cubes.browser import Cell, cuts_from_string, SPLIT_DIMENSION_NAME
from cubes.errors import *
from cubes.server.utils import *
from cubes.server.errors import *
from cubes.server.local import *
from cubes.calendar import CalendarMemberConverter

from contextlib import contextmanager



def requires_complex_browser(f):
    """Prepares three global variables: `g.cube`, `g.browser` and `g.cell`.
    Also athorizes the cube using `authorize()`."""

    @wraps(f)
    def wrapper(*args, **kwargs):
        if "lang" in request.args:
            g.locale = request.args.get("lang")
        else:
            g.locale = None


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





def sort_on_deps(joinslist, detail_table):
    joinslist = joinslist[::-1]
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

def add_table_identifier(meta_items, name, seperator="__"):
    for dim in meta_items:
        dim.name = name + seperator + dim.name
        try:
            dim.ref = name + seperator + dim.ref
        except:
            pass
        try:
            dim.measure = name + seperator + dim.measure
        except:
            pass
    return meta_items


#drill down example using hierarchies little documentation in cubes!
#http://localhost:5000/api/slicer/cube/test_geom/aggregate?aggregates=test_geom__amount&drilldown=test_geom__time@monthly:month&cut=test_geom__time.year:2010

def coalesce_cubes(master_meta, detail_meta, joiner):

    for item in ['aggregates', 'measures', 'dimensions']:
        master_meta[item] = add_table_identifier(master_meta[item], master_meta['name']) + \
                                    add_table_identifier(detail_meta[item], detail_meta['name'])


    master_meta_new = {}
    for mapkey in master_meta['mappings'].keys():
        master_meta_new[master_meta['name'] + "__" + mapkey] = master_meta['mappings'][mapkey]
    for mapkey in detail_meta['mappings']:
       master_meta_new[detail_meta['name'] + "__" + mapkey] = detail_meta['mappings'][mapkey]
    master_meta['mappings'] = master_meta_new
    #don't forget the actual amounts
    master_meta['mappings'][master_meta['name'] + '__amount'] = master_meta['name'] + '__entry.amount'
    master_meta['mappings'][detail_meta['name'] + '__amount'] = detail_meta['name'] + '__entry.amount'

    master_meta['mappings'].update(detail_meta['mappings'])
    master_meta['joins']  = master_meta['joins'] + \
        [{"master": "test_geom__Country_level0.label", "detail":"geometry__country_level0.label"}] + \
        sort_on_deps(detail_meta['joins'], "geometry__country_level0") #need to make sure the one being joined comes last

    master_meta['joins'] = master_meta['joins'][::-1]

    return master_meta