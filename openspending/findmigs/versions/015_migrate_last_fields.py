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

    ws = Column('webservice', String(500))
    agency = Column('agency', String(255))
    org = Column('organization', String(255))
    notes = Column('notes', String(4000))

    ws.create(dataset)
    agency.create(dataset)
    org.create(dataset)
    notes.create(dataset)
    pass


def downgrade(migrate_engine):
    # Operations to reverse the above upgrade go here.
    pass