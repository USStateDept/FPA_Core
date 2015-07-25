from sqlalchemy import *
from migrate import *
from datetime import datetime
from openspending.model.common import MutableDict, JSONType
meta = MetaData()


def upgrade(migrate_engine):
    # Upgrade operations go here. Don't create your own engine; bind
    # migrate_engine to your metadata
    meta.bind = migrate_engine
    
    account = Table('account', meta, autoload=True)
    moderator= Column('moderator', Boolean, default=False)

    update.create(dataset)
    pass


def downgrade(migrate_engine):
    # Operations to reverse the above upgrade go here.
    pass
