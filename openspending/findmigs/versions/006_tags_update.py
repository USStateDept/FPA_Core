from sqlalchemy import *
from migrate import *
from datetime import datetime
from openspending.model.common import MutableDict, JSONType
meta = MetaData()


def upgrade(migrate_engine):
   # Upgrade operations go here. Don't create your own engine; bind
    # migrate_engine to your metadata
    meta.bind = migrate_engine

    #########################tag change


    tags = Table('tags', meta, autoload=True)

    weight = Column('weight', Integer)

    weight.create(tags)

    parent_id = Column('parent_id', Integer, ForeignKey('tags.id'))

    parent_id.create(tags)



    dataset = Table('dataset', meta, autoload=True)

    metadataorg_id = Column('metadataorg_id', Integer, ForeignKey('metadataorg.id'))

    metadataorg_id.create(dataset)




    dataset = Table('dataorg', meta, autoload=True)
    metadataorg_id = dataset.c.metadataorg_id

    metadataorg_id.drop()

    pass


def downgrade(migrate_engine):
    # Operations to reverse the above upgrade go here.
    pass


