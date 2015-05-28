import logging
from openspending.command.util import create_submanager
from openspending.command.util import CommandException

from flask import current_app
import flask_whooshalchemy as whoo

log = logging.getLogger(__name__)

manager = create_submanager(description='Create model geometries to be used for country pages')


@manager.command
def create():
    """ Create the geometry model from the geometry__country_level0 table """
    from openspending.core import db
    from openspending.model.country import Country

    result = db.engine.execute("SELECT \
                        country_level0.gid as gid \
                        FROM public.geometry__country_level0 as country_level0;")


    for row in result:
        gid = row['gid']

        #check if it already exists and don't overwrite
        if Country.by_gid(gid):
            log.info("Found existing gid " + str(gid) + ".  Will not replace.")
            continue

        tempcountry = Country(gid)

        db.session.add(tempcountry)
        db.session.commit()

