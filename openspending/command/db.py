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
def drop():
    """ Drop database """
    log.warn("Dropping database")
    db.metadata.reflect()
    db.metadata.drop_all()

@manager.command
def drop_dataset(**args):
    """ Drop a dataset from the database """
    log.warn("Dropping dataset '%s'", name)
    dataset = db.session.query(Dataset).filter_by(name=name).first()
    if dataset is None:
        raise CommandException("Dataset does not exist: '%s'" % name)
    dataset.drop()
    db.session.delete(dataset)
    db.session.commit()


@manager.command
def migrate():
    """ Run pending data migrations """
    url = current_app.config.get('SQLALCHEMY_DATABASE_URI')
    repo = os.path.join(os.path.dirname(__file__), '..', 'migration')

    try:
        migrate_api.upgrade(url, repo)
    except DatabaseNotControlledError:
        # Assume it's a new database, and try the migration again
        migrate_api.version_control(url, repo)
        migrate_api.upgrade(url, repo)

    diff = migrate_api.compare_model_to_db(url, repo, db.metadata)
    if diff:
        print diff
        raise CommandException("The database doesn't match the current model")


@manager.command
def modelmigrate():
    """ Run pending data model migrations """
    from openspending.validation.model.migration import migrate_model
    dataset = db.Table('dataset', db.metadata, autoload=True)
    rp = db.engine.execute(dataset.select())
    while True:
        ds = rp.fetchone()
        if ds is None:
            break
        log.info('Migrating %s...', ds['name'])
        model = migrate_model(ds['data'])
        version = model.get('dataset').get('schema_version')
        if 'dataset' in model:
            del model['dataset']
        q = dataset.update().where(dataset.c.id == ds['id'])
        q = q.values({'data': model, 'schema_version': version})
        db.engine.execute(q)


@manager.command
def init():
    """ Initialize the database """
    migrate()
