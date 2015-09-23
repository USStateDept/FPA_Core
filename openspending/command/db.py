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


from openspending.lib.denormalize import denormalize as denormalize_table
from openspending.views.api_v2.dataset import index as get_datasets
import json
from sqlalchemy import MetaData
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
    resp= get_datasets()
    datasetdb = dataset.connect(current_app.config.get("SQLALCHEMY_DATABASE_URI"), schema="finddata")
    datasets = json.loads(resp.data)
    metadata = MetaData(bind=db.engine)
    try:
        db.engine.execute("CREATE SCHEMA finddata")
    except Exception, e:
        print "ERORR", e

    existingtables = datasetdb.tables

    for d in datasets:
        tablename = d['name']

        result = denormalize_table(tablename=tablename, existingtables=existingtables, droptables=droptables, datasetdb=datasetdb,metadata=metadata)
