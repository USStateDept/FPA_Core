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

    feedback = Table('feedback', meta,
                    Column('id', Integer, primary_key=True),
                    Column('email', Unicode(2000)),
                    Column('created_at', DateTime, default=datetime.utcnow),
                    Column('name', Unicode(2000)),
                    Column('url', Unicode(2000)),
                    Column('message', Unicode()),
                    Column('read', Boolean, default=False)
                    )

    feedback.create()



    pass


def downgrade(migrate_engine):
    # Operations to reverse the above upgrade go here.
    pass
