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
    account = Table('dataset', meta, autoload=True)



    #########################Account

    dataview = Table('dataview', meta,
                    Column('id', Integer, primary_key=True),
                    Column('title', Unicode(500)),
                    Column('description', Unicode()),
                    Column('created_at', DateTime),
                    Column('updated_at', DateTime),
                    Column('urlhash', Unicode(2000)),
                    Column('account_id', Integer, ForeignKey('account.id')),
                    Column('cloned_dataview_id', Integer, ForeignKey('dataview.id')),
                    Column('settings', MutableDict.as_mutable(JSONType), default=dict)
                    )

    dataview.create()


    ################## ManytoMany accounts to datasets
    dataview_dataset_table = Table(
        'dataview_dataset', meta,
        Column('dataview_id', Integer, ForeignKey('dataview.id'),
               primary_key=True),
        Column('dataset_id', Integer, ForeignKey('dataset.id'),
               primary_key=True)
    )

    dataview_dataset_table.create()

    pass


def downgrade(migrate_engine):
    # Operations to reverse the above upgrade go here.
    pass
