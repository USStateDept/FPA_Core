from sqlalchemy import *
from migrate import *
from datetime import datetime
from openspending.model.common import MutableDict, JSONType
meta = MetaData()


def upgrade(migrate_engine):
    # Upgrade operations go here. Don't create your own engine; bind
    # migrate_engine to your metadata
    meta.bind = migrate_engine


    #########################Account


    """ A view stores a specific configuration of a visualisation widget. """



    country = Table('country', meta,
                    Column('id', Integer, primary_key=True),
                    Column('gid', Integer, unique=True),
                    Column('geounit', Unicode(300), unique=True),
                    Column('label', Unicode(300)),
                    Column('pagesettings', MutableDict.as_mutable(JSONType), default=dict)
                    )

    country.create()



    pass


def downgrade(migrate_engine):
    # Operations to reverse the above upgrade go here.
    pass
