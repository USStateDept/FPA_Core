import logging
import os
import argparse
import sys
import codecs

from flask import current_app
import migrate.versioning.api as migrate_api
from migrate.exceptions import DatabaseNotControlledError

from openspending.core import db
from openspending.model import Dataset
from openspending.command.util import create_submanager
from openspending.command.util import CommandException

log = logging.getLogger(__name__)

from sqlalchemy.sql import text

manager = create_submanager(description='Database operations')


# @manager.option('-g', '--geom-file', dest='geomfile_user', action='store_true',
#                 help="Path to .sql file for geometries (Optional)",
#                 required=False,
#                 default=None
@manager.option('geomfile_user', nargs=argparse.REMAINDER,
                help="Dataset file URLs")
@manager.command
def create_geometry(**args):
    """ Create the geometry tables necessary for cubes """

    print "sorry this is not currently possible with sqlalchemy"
    print "looking for alternatives like subprocess or just a batch file"

    print "until then load the fixtures/goemetry_file.backup using pgadmin"
    print "or use psql with your DB and use geometry_file.sql"


    # geomfile = None
    # if (args['geomfile_user']):
    #     try:
    #         geomfile = codecs.open(args['geomfile'], 'r', "utf_8")
    #     except:
    #         print "could not find the specified geometry file"
    #         sys.exit()
    # else:
    #     try:
    #         geomfile = codecs.open(current_app.config['APP_ROOT'] + '/fixtures/geometry_final.sql', 'r', "utf_8")
    #     except Exception,e:
    #         print "could not find the default file.  Consider defining the absolute path and -g flag"
    #         sys.exit()
    # print "before this"
    # q = geomfile.read()
    # db.engine.execute(text(q))
    # db.engine.commit()
    # print "after this"
    # try:
    #     a = 1
    #     #print geomfile
    # except Exception, e:
    #     geomfile.close()
    #     #print "Load failed", e
    #     sys.exit()
    # geomfile.close()

    # print "Load Success"






@manager.command
def migrate():
    """ Run pending data migrations """
    url = current_app.config.get('SQLALCHEMY_DATABASE_URI')
    log.info(current_app.config)
    repo = os.path.join(os.path.dirname(__file__), '..', 'findmigs')

    try:
        migrate_api.upgrade(url, repo)
    except DatabaseNotControlledError:
        # Assume it's a new database, and try the migration again
        migrate_api.version_control(url, repo)
        migrate_api.upgrade(url, repo)



@manager.command
def init():
    """ Initialize the database """
    migrate()




from openspending import model


from sqlalchemy.orm import class_mapper




@manager.command
def schemadraw(**args):
    try:
        from sqlalchemy_schemadisplay import create_uml_graph
    except ImportError:
        log.critical("You must install sqlalchemy_schemadisplay\n$pip install sqlalchemy_schemadisplay")
        sys.exit(1)


    # lets find all the mappers in our model
    mappers = []
    for attr in dir(model):
        if attr[0] == '_': continue
        try:
            cls = getattr(model, attr)
            mappers.append(class_mapper(cls))
        except:
            pass

    # pass them to the function and set some formatting options
    graph = create_uml_graph(mappers,
        show_operations=False, # not necessary in this case
        show_multiplicity_one=False # some people like to see the ones, some don't
    )
    graph.write_png('./doc/DevOps/dbschema.png') # write out the file


from openspending.views.api_v2.dataset import index as get_datasets
import json
from sqlalchemy import *
from flask import current_app
import sys

@manager.option('-d', '--drop', dest='droptables', action='store_true',
                help="Drop existing tables (Optional)",
                required=False,
                default=None)
@manager.command
def denormalize(**args):
    """
    fetch all of the data tables and create a denomalized flat table.  
    """
    try:
        import dataset
    except ImportError:
        print "dataset must be installed, pip install dataset"
        sys.exit()

    droptables = args.get('droptables', None)
    singletable = args.get("table", None)
    resp= get_datasets()
    datasetdb = dataset.connect(current_app.config.get("SQLALCHEMY_DATABASE_URI"), schema="finddata")
    datasets = json.loads(resp.data)
    metadata = MetaData(bind=db.engine)
    try:
        db.session.execute("CREATE SCHEMA finddata")
    except Exception, e:
        print e
    if singletable:
        existingtables = [{"name": singletable}]
    else:
        existingtables = datasetdb.tables

    for d in datasets:
        tablename = d['name']
        if "finddata.%s__denorm"%tablename in existingtables and droptables:
            existingtable = datasetdb["%s__denorm"%tablename ]
            existingtable.drop()
            print "DELETING"
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
                    Column('time', Unicode(10), index=True),
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
            continue
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