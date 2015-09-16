import logging
import urlparse
from dateutil import parser
# import pandas as pd
# import numpy as np

from flask import current_app,request

from openspending.core import db

from openspending.lib.helpers import get_dataset

from openspending.lib.cubes_util import get_cubes_breaks



log = logging.getLogger(__name__)


from sqlalchemy import Table, MetaData, Column, Integer, String, ForeignKey
from sqlalchemy.orm import mapper
from sqlalchemy.sql.expression import func 
from sqlalchemy.sql import table, column, select
from openspending.lib.helpers import get_dataset




# CREATE INDEX geogid
#    ON geometry__time USING btree (gid ASC NULLS LAST);

# http://stackoverflow.com/questions/11401749/pass-in-where-parameters-to-postgresql-view
# create or replace function label_params(parm1 text, parm2 text)
#   returns table (param_label text, param_graphics_label text)
# as
# $body$
#   select ...
#   WHERE region_label = $1 
#      AND model_id = (SELECT model_id FROM models WHERE model_label = $2)
#   ....
# $body$
# language sql;
# Then you can do:

# select *
# from label_params('foo', 'bar')


# http://localhost:5000/api/slicer/cube/geometry/cubes_aggregate?&
# cluster=jenks&
# numclusters=4&
# cubes=hyogo_framework_for_action_hfa&
# cut=geometry__time:1990-2015&
# order=time&
# drilldown=geometry__country_level0@name|geometry__time&
# cut=geometry__country_level0@name:afghanistan;angola;armenia


# http://find.state.gov/api/slicer/cube/geometry/cubes_aggregate?&
# cluster=jenks&
# numclusters=4&
# cubes=access_to_credit_strength_of_l|hyogo_framework_for_action_hfa&
# cut=geometry__time:1990-2015&
# order=time
# &drilldown=geometry__country_level0@name|geometry__time
# &cut=geometry__country_level0@name:albania;argentina;australia;azerbaijan

    # #browser parameters
    # # - cubes (attribute, many)
    #     - e.g. cubes=cubes1_code|cubes2_code
    #     - default return error it is required
    # # - daterange (attribute, range)
    #     - e.g. daterange=2010-2014 or in future implementions date=yesterday-now
    #     - default return 1990-current year
    # # - format (attribute, one)
    #     - e.g. format=json
    #     - default json
    #     - options json, csv, excel
    # # - drilldown (drilldown, one)
    #     - e.g. drilldown=geometry__country_level0@name|geometry__time
    #     - default aggregate all
    #     - options geometry__country_leve0@see columns of regions, geometry__time,  
    # # - cut (dates, data values, countries)
    #     - e.g. cut=geometry__country_level0@name:somecountrycode1;somecountrycode2
    #     - default to return all
    # # - agg (display using an order chain of the data   
    #     - e.g. agg=geometry__country_level0@{columnname}|geometry__time
    #         - returns dict structure of {
    #                     'geometry__country_level0':{
    #                         'geometry__time': {
    #                             'result'
    #                         }
    #                 }   }
    # # - orderby (attribute, one)
    #       - e.g. orderby=geometry__country_level0@{columnname}

def parse_date(datestring):
    try:
        return parser.parse(datestring)
    except Exception, e:
        log.warn("Could not parse %s"%datestring)
        return None


FORMATOPTS = {'json', 'csv', 'excel', 'xls', 'geojson'}
RETURNLIMIT= 10000
DEFAULTDRILLDOWN = {"geometry__country_level0":"sovereignt","geometry__time":"time"}


class DataBrowser(object):
    """
        input is query string
    """

    def __init__(self):
        self.params = {}
        self.cubes = []
        self.daterange= {"start":None,"end":None}
        self.format='json'
        self.agg = {}
        self.drilldown = {}
        self.cut={}
        self.nulls=True

        self.dataframe = None

        self.geomtables = ['geometry__time', 'geometry__country_level0']

        self.cubes_tables = []

        self.t = {}

        self.cachedresult = None

        self._parse_params()

        self._map_tables()

        if self.drilldown:
            self._drilldowns()

            self.selectable = select(self.selects).select_from(self.joins)

            for table_name, dds in self.drilldown.iteritems():
                for dd in dds:
                    self.selectable = self.selectable.group_by(self.t[table_name].c[dd])
        else:

            self.selectable = select(self.selects).select_from(self.joins)

        for table_name, cols in self.cut.iteritems():
            for colname, values in cols.iteritems():
                self.selectable = self.selectable.where(self.t[table_name].c[colname].in_(values))
        if self.daterange['start']:
            self.selectable = self.selectable.where(self.t["geometry__time"].c["time"] >= self.daterange['start'])
        if self.daterange['end']:
            self.selectable = self.selectable.where(self.t["geometry__time"].c["time"] <= self.daterange['end'])

        if not self.nulls:
            for cube_tb in self.cubes_tables: 
                self.selectable = self.selectable.where(self.t[cube_tb].c["amount"] != None)

     
        #completed the selects, now doing the wheres and groupby



    def _drilldowns(self):
        #make sure column exists
        for tablename, drilldowns in self.drilldown.iteritems():
            for dd in drilldowns:
                if tablename == "geometry__country_level0":
                    self.selects.append(self.t[tablename].c[dd].label("geo__%s"%dd))
                else:
                    self.selects.append(self.t[tablename].c[dd])

            #group_by(t['geometry__country_level0'].c['dos_region'])

    def _map_tables(self):
        self.metadata = MetaData()
        reflectiontables = self.geomtables + self.cubes_tables
        self.metadata.reflect(db.engine, only=reflectiontables)
        self.t = {z.name:z for z in self.metadata.sorted_tables}
        #apply joins
        self.joins = self.t["geometry__time"].join(self.t['geometry__country_level0'],self.t['geometry__country_level0'].c.gid==self.t['geometry__time'].c.gid)

        callables = {"__max":func.max, "__min": func.min, "__avg":func.avg, "__sum":func.sum}

        self.selects = [func.count(self.t['geometry__time'].c.id).label("count")]

        for cubes_ts in self.cubes_tables:
            self.joins = self.joins.outerjoin(self.t[cubes_ts], \
                                        self.t[cubes_ts].c.geom_time_id==self.t['geometry__time'].c.id)
            for lab, caller in callables.iteritems():
                self.selects.append(caller(self.t[cubes_ts].c.amount).label(cubes_ts.strip("__entry") + lab))

        

    def _getcache(self):
        if self.cachedresult:
            return self.cachedresult
        else:
            self.cachedresult = [x for x in self._execute_query_iterator()]
            return self.cachedresult        

    def _execute_query_iterator(self):
        results = db.session.execute(self.selectable)
        for u in results.fetchall():
            yield dict(u)


    def get_clusters(self, resultsdict, field=None):

        if not field:
            field = self.cubes_tables[0].strip("__entry") + "__avg"

        return get_cubes_breaks(resultsdict, field, method=self.clusterparams['cluster'], k=self.clusterparams['clusternum'])



    def get_json_result(self):
        results = self._getcache()
        resultmodel = {
            "cells": results
        }

        tempmodel = {}
        for dataset in self.cubes:
            tempmodel[dataset] = get_dataset(dataset).detailed_dict()


        resultmodel['models'] = tempmodel

        if self.clusterparams['cluster']:
            resultmodel['cluster'] = self.get_clusters(resultmodel['cells'])        
        
        return resultmodel



    def _parse_params(self):

        cubes_arg = request.args.get("cubes", None)

        try:
            self.cubes = cubes_arg.split("|")
            self.cubes_tables = ["%s__entry"%c for c in self.cubes]
        except:
            raise RequestError("Parameter cubes with value  '%s'should be a valid cube names separated by a '|'"
                    % (cubes_arg) )

        if len (self.cubes) > 5:
            raise RequestError("You can only join 5 cubes together at one time")  


        #parse the date
        dateparam = request.args.get("daterange", None)
        if dateparam:
            datesplit = dateparam.split("-")
            if len(datesplit) == 1:
                self.daterange['start'] = parse_date(datesplit[0]).year
                #use this value to do a since date
            elif len(datesplit) == 2:
                self.daterange['start'] = parse_date(datesplit[0]).year
                if self.daterange['start']:
                    self.daterange['end'] = parse_date(datesplit[1]).year



        #parse format
        tempformat = request.args.get("format", None)
        if tempformat:
            if tempformat.lower() not in FORMATOPTS:
                log.warn("Could not find format %s"%tempformat)
            else:
                self.format = tempformat[0].lower()
        else:
            self.format = 'json'


        #parse cut
        #cut=geometry__country_level0@name:albania;argentina;australia;azerbaijan
        tempcuts = request.args.get("cut", None)
        if tempcuts:
            cutsplit = tempcuts.split("|")
            for tempcut in cutsplit:
                basenamesplit = tempcut.split(":")
                name = basenamesplit[0]
                values = basenamesplit[1].split(';')

                cutter = name.split("@")
                if len(cutter) > 1:
                    if self.cut.get(cutter[0]):
                        self.cut[cutter[0]][cutter[1]] = values
                    else:
                        self.cut[cutter[0]] = {cutter[1]:values}
                else:
                    if self.cut.get(cutter[0]):
                        self.cut[cutter[0]][DEFAULTDRILLDOWN.get(cutter[0])] = values
                    else:
                        self.cut[cutter[0]] = {DEFAULTDRILLDOWN.get(cutter[0]):values}

        # tempagg = request.args.get("agg", None)
        # if tempagg:
        #     aggsplit = tempagg.split("|")
        #     for tempitem in aggsplit:
        #         pass

        tempdrilldown = request.args.get("drilldown", None)
        if tempdrilldown:
            drilldownsplit = tempdrilldown.split("|")
            for tempdrill in drilldownsplit:
                dd = tempdrill.split("@")
                if len(dd) > 1:
                    if self.drilldown.get(dd[0]):
                        self.drilldown[dd[0]].append(dd[1])
                    else:
                        self.drilldown[dd[0]] = [dd[1]]
                else:
                    if self.drilldown.get(dd[0]):
                        self.drilldown[dd[0]].append(DEFAULTDRILLDOWN.get(dd[0]))
                    else:
                        self.drilldown[dd[0]] = [DEFAULTDRILLDOWN.get(dd[0])]

        self.nulls = request.args.get("nulls", False)


        self.clusterparams = {
            "cluster": request.args.get("cluster", None),
            "clusternum": request.args.get("clusternum",5)
        }

                        
# GEO_MAPPING = {"geometry__country_level0":  {
#                         "name": {
#                           "name": "name",
#                           "label": "Country Name"
#                         },                        
#                         "sovereignty": {
#                           "name": "sovereignt",
#                           "label": "Sovereignty"
#                         },
#                         "dos_region":{
#                           "name": "dos_region",
#                           "label": "Department of State Regions" 
#                         },
#                         "usaid_reg": {
#                           "name": "usaid_reg",
#                           "label": "USAID Regions"
#                         },
#                         "dod_cmd": {
#                           "name": "dod_cmd",
#                           "label": "Department of Defense Regions"
#                         },
#                         "feed_the_future": {
#                           "name": "feed_the_f",
#                           "label": "Feed the Future Regions"
#                         },
#                         "pepfar": {
#                           "name": "pepfar",
#                           "label": "PEPFAR Regions"
#                         },
#                         "paf": {
#                           "name": "paf",
#                           "label": "PAF Regions"
#                         },
#                         "oecd": {
#                           "name": "oecd",
#                           "label": "OECD Regions"
#                         },
#                         "region_un":{
#                           "name": "region_un",
#                           "label": "United Nation Regions"
#                         },
#                         "subregion":{
#                           "name": "subregion",
#                           "label": "Subregions"
#                         },
#                         "region_wb": {
#                           "name": "region_wb",
#                           "label": "World Bank Regions"
#                         },
#                         "wb_inc_lvl":{
#                           "name": "wb_inc_lvl",
#                           "label": "World Bank Income Level Regions"
#                         },                        
#                         "continent":{
#                           "name": "continent",
#                           "label": "Continents"
#                         }
#                     }
#                 }