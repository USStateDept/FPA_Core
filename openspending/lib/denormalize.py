import logging

from flask import current_app,request, Response

from openspending.core import db

from sqlalchemy import *
from flask import current_app
import dataset


log = logging.getLogger(__name__)




def denormalize(tablename=None, existingtables=[], droptables=False, datasetdb=None, metadata=None):
    if not tablename:
        return None

    if not metadata:
        metadata = MetaData(bind=db.engine)

    if not datasetdb:
        datasetdb = dataset.connect(current_app.config.get("SQLALCHEMY_DATABASE_URI"), schema="finddata")

    if not existingtables:
        existingtables = datasetdb.tables


    if "finddata.%s__denorm"%tablename in existingtables and droptables:
        existingtable = datasetdb["%s__denorm"%tablename ]
        existingtable.drop()
        log.debug("DELETING %s"%tablename)
        datasetdb.commit()



    temptable = Table("%s__denorm"%tablename , metadata,
                Column('name_short', Unicode(100)),
                Column('sovereignt', Unicode(150)),
                Column('subregion', Unicode(150)),
                Column('pepfar', Unicode(150)),
                Column('homepart', Unicode(150)),
                Column('region_wb', Unicode(150)),
                Column('continent', Unicode(150)),
                Column('region_un', Unicode(150)),
                Column('formal_en', Unicode(200)),
                Column('amount', Float()),
                Column('label', Unicode(150)),
                Column('oecd', Unicode(150)),
                Column('geounit', Unicode(150)),
                Column('gid', Integer()),
                Column('geom_time_id', Integer(), primary_key=True, index=True),
                Column('iso_n3', Unicode(5)),
                Column('paf', Unicode(150)),
                Column('country_level0_id', Integer()),
                Column('feed_the_f', Unicode(150)),
                Column('dos_region', Unicode(150)),
                Column('wb_a2', Unicode(150)),
                Column('wb_a3', Unicode(150)),
                Column('usaid_reg', Unicode(150)),
                Column('iso_a3', Unicode(150)),
                Column('iso_a2', Unicode(150)),
                Column('name', Unicode(150)),
                Column('dod_cmd', Unicode(150)),
                Column('wb_inc_lvl', Unicode(150)),
                Column('time', Integer(), index=True),
                schema='finddata'
                )
    temptable.create()

    

    dataset_table = datasetdb["%s__denorm"%tablename ]

    query = """SELECT geometry__time.*, geometry__country_level0.*, %s__entry.*
                FROM geometry__time JOIN geometry__country_level0 ON geometry__country_level0.gid = geometry__time.gid 
                LEFT OUTER JOIN %s__entry ON %s__entry.geom_time_id = geometry__time.id 
                WHERE geometry__time.time >= 1990 AND 
                    geometry__time.time <= 2015
                ORDER BY geometry__time.time"""%(tablename, tablename, tablename)
    

    unused = ["mapcolor13", "scalerank", "short_name", 
    "mapcolor7", "mapcolor8", "mapcolor9", "theid", "time_id", "tiny", "note", "admin", "abbrev", 
    "long_len", "name_len", "un_a3", "abbrev_len", "postal", "type", "id", "georegion", "name_long", "geom", "labelrank"]

    try:
        result = db.engine.execute(query)
    except Exception, e:
        result = None
    if not result:
        return None
    for row in result:
        x = dict(row)
        for u in unused:
            del x[u]
        if not x['geom_time_id']:
            continue
        try:
            dataset_table.insert(x, ensure=False)
            datasetdb.commit()
        except Exception, e:
            print e