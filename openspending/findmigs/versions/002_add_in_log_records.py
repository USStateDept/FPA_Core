from sqlalchemy import *
from migrate import *
from datetime import datetime
from openspending.model.common import MutableDict, JSONType
meta = MetaData()


def upgrade(migrate_engine):
   # Upgrade operations go here. Don't create your own engine; bind
    # migrate_engine to your metadata
    meta.bind = migrate_engine

    run = Table('run', meta, autoload=True, autoload_with=migrate_engine)




    #########################log_record
    log_record = Table('log_record', meta,
                    Column('id', Integer, primary_key=True),
                    Column('run_id', Integer, ForeignKey('run.id')),
                    Column('category', Unicode),
                    Column('level', Unicode),
                    Column('message', Unicode),
                    Column('error', Unicode),
                    Column('attribute', Unicode),
                    Column('column', Unicode),
                    Column('data_type', Unicode),
                    Column('value', Unicode),
                    Column('timestamp', DateTime, default=datetime.utcnow),
                    Column('row', Integer),
                    )

    log_record.create()

    pass

def downgrade(migrate_engine):
    # Operations to reverse the above upgrade go here.
    pass
