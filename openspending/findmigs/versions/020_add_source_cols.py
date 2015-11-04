from sqlalchemy import *
from migrate import *
from datetime import datetime
from openspending.model.common import MutableDict, JSONType
meta = MetaData()


def upgrade(migrate_engine):
    # Upgrade operations go here. Don't create your own engine; bind
    # migrate_engine to your metadata

    meta.bind = migrate_engine
    
    scope = Column('scope', String(255))
    dataset = Table('dataset', meta, autoload=True)
    lastOrgUpate=Column('lastorgupdate', DateTime)
    whenToUpate=Column('whentoupdate', DateTime)

    scope.create(dataset)
    lastOrgUpate.create(dataset)
    whenToUpate.create(dataset)
    pass


def downgrade(migrate_engine):
    # Operations to reverse the above upgrade go here.
    pass
