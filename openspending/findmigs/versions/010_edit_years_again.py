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
    
    years = dataset.c.years

    years.drop()
    
    years2 = Column('years', String(1000))

    years2.create(dataset)
    pass


def downgrade(migrate_engine):
    # Operations to reverse the above upgrade go here.
    pass