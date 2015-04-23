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


    account = Table('dataset', meta, autoload=True)


    tags = Table('tags', meta,
                    Column('id', Integer, primary_key=True),
                    Column('slug_label', Unicode(500)),
                    Column('label', Unicode(500)),
                    Column('category', Unicode(500), default="categories")
                    )

    tags.create()

    ################## ManytoMany tags to datasets

    tags_dataset_table = Table(
        'tags_dataset', meta,
        Column('dataset_id', Integer, ForeignKey('dataset.id'),
               primary_key=True),
        Column('tags_id', Integer, ForeignKey('tags.id'),
               primary_key=True)
    )

    tags_dataset_table.create()
    pass


def downgrade(migrate_engine):
    # Operations to reverse the above upgrade go here.
    pass


