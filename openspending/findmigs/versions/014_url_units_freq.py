from sqlalchemy import *
from migrate import *
from datetime import datetime
from openspending.model.common import MutableDict, JSONType
meta = MetaData()


def upgrade(migrate_engine):
    # Upgrade operations go here. Don't create your own engine; bind
    # migrate_engine to your metadata
    meta.bind = migrate_engine
    
    dataset = Table('dataset', meta, autoload=True)

    update = Column('update_freq', String(255))
    orgurl = Column('orgurl', String(500))
    units = Column('units', String(255))

    update.create(dataset)
    orgurl.create(dataset)
    units.create(dataset)
    pass


def downgrade(migrate_engine):
    # Operations to reverse the above upgrade go here.
    pass