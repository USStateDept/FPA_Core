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
from cubes.server.decorators import prepare_cell
from cubes.calendar import CalendarMemberConverter

from contextlib import contextmanager



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

        if "lang" in request.args:
            g.locale = request.args.get("lang")
        else:
            g.locale = None


        prepare_cell(restrict=False)


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
        print "here's my tempmaster"
        print tempmaster

        print "heres my finaljoins"
        print finaljoins
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
    #joinslist = joinslist[::-1]
    #find the instance of this detail table in master and move it to the top
    print "detail_table", detail_table
    theindex = -1
    for j in range(len(joinslist)):
        print "\n\n"
        print "looking at ", joinslist[j]['detail'].split(".")[0]
        if joinslist[j]['detail'].split(".")[0] == detail_table:
            theindex = j
            continue
    if theindex == -1:
        print "!!!!!!!!!Error here"
    print "here is the index", theindex
    keyjoin = {'master': joinslist[theindex]['detail'], 'detail':joinslist[theindex]['master']}
    joinslist.pop(theindex)
    joinslist.insert(0, keyjoin)
    return joinslist

def add_table_identifier(meta_data, seperator="__"):
    for item in ['aggregates', 'measures', 'dimensions']:
        for dim in meta_data[item]:
            dim.name = meta_data['name'] + seperator + dim.name
            try:
                dim.ref = meta_data['name'] + seperator + dim.ref
            except:
                pass
            try:
                dim.measure = meta_data['name'] + seperator + dim.measure
            except:
                pass
    master_meta_new = {}
    for mapkey in meta_data['mappings']:
       master_meta_new[meta_data['name'] + "__" + mapkey] = meta_data['mappings'][mapkey]
    meta_data['mappings'] = master_meta_new

    meta_data['mappings'][meta_data['name'] + '__amount'] = meta_data['name'] + '__entry.amount'
    meta_data['mappings'].update(meta_data['mappings'])


    return meta_data


#drill down example using hierarchies little documentation in cubes!
#http://localhost:5000/api/slicer/cube/test_geom/aggregate?aggregates=test_geom__amount&drilldown=test_geom__time@monthly:month&cut=test_geom__time.year:2010

def coalesce_cubes(master_meta, detail_meta):
    #join on lowest geographical hierarchy
    #join on year field

    #search for "Country_level0" or country_level0 or any other labels we might apply in case not consistent in data loading
    #before we do amny edits to the master_meta
    candidates = ["Country_level0.label", "country_level0.label"]
    leftjoin_field = None
    for joinfield in master_meta['dimensions']:
        print "using to compare", joinfield.name.split('__')[1]+ ".label"
        if joinfield.name.split('__')[1] + ".label" in candidates:
            leftjoin_field = joinfield.name+ ".label" 

    rightjoin_field = None
    for joinfield2 in detail_meta['dimensions']:
        print "using to compare", joinfield2.name.split('__')[1]+ ".label"
        if joinfield2.name.split('__')[1] + ".label" in candidates:
            rightjoin_field = joinfield2.name+ ".label" 

    if not rightjoin_field or not leftjoin_field:
        print "could not find the right join or the left join"
        raise RequestError("Could not find join value for '%s'and '%s'.  Checked %s"
                % (master_meta['name'], detail_meta['name'], candidates) )


    #add in all of the components to the master_meta
    for item in ['aggregates', 'measures', 'dimensions']:
        master_meta[item] = master_meta[item] + detail_meta[item]

    master_meta['mappings'].update(detail_meta['mappings'])



    #join_dict example {"master": "test_geom__Country_level0.label", "detail":"geometry__country_level0.label"}
    master_meta['joins']  = master_meta['joins'] + \
        [{"master": leftjoin_field, "detail":rightjoin_field}] + \
        figure_out_deps(detail_meta['joins'], rightjoin_field.split(".")[0])
        #sort_on_deps(detail_meta['joins'], rightjoin_field.split(".")[0]) #need to make sure the one being joined comes last
        #detail_meta['joins']
        #sort_on_deps(detail_meta['joins'], rightjoin_field.split(".")[0]) #need to make sure the one being joined comes last

    # for eachjoin in master_meta['joins']:
    #     print "looking at ", eachjoin
    #     goodrun = False
    #     for themap in master_meta['mappings'].keys():
    #         if eachjoin['detail'] == themap:
    #             goodrun = True
    #             break
    #     if goodrun:
    #         print "good run"
    #     else:
    #         print "**************you fail*************"


    #master_meta['joins'] = figure_out_deps(master_meta['joins'])
    master_meta['joins'] = master_meta['joins'][::-1]


    return master_meta