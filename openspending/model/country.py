from datetime import datetime

#from sqlalchemy.orm import relationship, backref
from sqlalchemy.schema import Column, ForeignKey
from sqlalchemy.types import Integer, Unicode, Boolean, DateTime

from openspending.core import db,cache
from openspending.model.common import MutableDict, JSONType


class Country(db.Model):

    """ A view stores a specific configuration of a visualisation widget. """

    __tablename__ = 'country'
    __searchable__ = ['label']


    id = Column(Integer, primary_key=True)
    gid = Column(Integer, unique=True)
    geounit = Column(Unicode(300), unique=True)
    label = Column(Unicode(300))
    pagesettings = Column(MutableDict.as_mutable(JSONType), default=dict)


    def __init__(self, gid):
        #gid is the reference to the geometry tables

        #get and populate the data to the geometry_tables

        self.gid = gid

        result = db.engine.execute("SELECT \
                                    country_level0.name as geounit, \
                                    country_level0.label as label \
                                    FROM public.geometry__country_level0 as country_level0 \
                                    WHERE country_level0.gid = %s;" %(self.gid,))
        tempobj = result.first()

        if not tempobj:
            pass

        self.geounit = tempobj['geounit']
        self.label = tempobj['label']



        pass



    @property
    def sovereignty(self):
        result = db.engine.execute("SELECT \
                                    country_level0.sovereignt as sovereignty \
                                    FROM public.geometry__country_level0 as country_level0 \
                                    WHERE country_level0.gid = %s;" %(self.gid,))
        return result.first()['sovereignty']


    @property 
    def regions(self):
        result = db.engine.execute("SELECT \
                            country_level0.sovereignt as sovereignty, \
                            country_level0.label as label, \
                            country_level0.continent as continent, \
                            country_level0.georegion as georegion, \
                            country_level0.dos_region as dos_region, \
                            country_level0.usaid_reg as usaid_reg, \
                            country_level0.dod_cmd as dod_cmd, \
                            country_level0.feed_the_f as feed_the_f, \
                            country_level0.region_un as region_un, \
                            country_level0.wb_inc_lvl as wb_inc_lvl \
                            FROM public.geometry__country_level0 as country_level0 \
                            WHERE country_level0.gid = %s" %(self.gid,))
        tempobj = result.first()
        return tempobj

    @classmethod
    #@cache.memoize(timeout=360)
    def get_all_json(cls):
        regions = ['continent', 'georegion', 'dos_region', 'usaid_reg', 'dod_cmd',\
                    'feed_the_f', 'region_un', 'wb_inc_lvl']
        result = db.engine.execute("SELECT \
                            country_level0.name as geounit, \
                            country_level0.sovereignt as sovereignty, \
                            country_level0.label as label, \
                            country_level0.iso_a2 as iso_a2, \
                            country_level0.continent as continent, \
                            country_level0.georegion as georegion, \
                            country_level0.dos_region as dos_region, \
                            country_level0.usaid_reg as usaid_reg, \
                            country_level0.dod_cmd as dod_cmd, \
                            country_level0.feed_the_f as feed_the_f, \
                            country_level0.region_un as region_un, \
                            country_level0.wb_inc_lvl as wb_inc_lvl \
                            FROM public.geometry__country_level0 as country_level0 \
                            WHERE country_level0.label = country_level0.sovereignt \
                            ORDER BY country_level0.name;")
        output = []
        for country in result:
            tempreg= {}
            #tempreg = [country[reg] for reg in regions]
            for reg in regions:
                tempreg[reg] = country[reg]

            output.append({
                    'geounit': country["geounit"],
                    'label': country['label'],
                    'iso_a2': country['iso_a2'],
                    'regions': tempreg,
                    'selected' : False,
                    'filtered' : False,
                    'id' : country['iso_a2']
                })
        return output



    @classmethod
    def all(cls):
        """ Query available datasets based on dataset visibility. """
        q = db.session.query(cls)
        return q



    @classmethod
    def by_id(cls, id):
        return db.session.query(cls).filter_by(id=id).first()

    @classmethod
    def by_gid(cls, gid):
        return db.session.query(cls).filter_by(gid=gid).first()

    @classmethod
    def by_geounit(cls, geounit):
        return db.session.query(cls).filter_by(geounit=geounit).first()


    def __repr__(self):
        return "<Country(%r,%r)>" % (self.geounit, self.gid)
