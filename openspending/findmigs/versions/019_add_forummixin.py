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

    banned= Column('banned', Boolean, default=False)
    banned.create(account)
    website = Column('website', String(200))
    website.create(account)
    location = Column('location', String(100))
    location.create(account)
    post_count = Column('post_count', Integer, default=0)
    post_count.create(account)



    pass




def downgrade(migrate_engine):
    # Operations to reverse the above upgrade go here.
    pass
