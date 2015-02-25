from sqlalchemy import *
from migrate import *
from openspending.model.common import MutableDict, JSONType
meta = MetaData()

def upgrade(migrate_engine):
    # Upgrade operations go here. Don't create your own engine; bind
    # migrate_engine to your metadata
    meta.bind = migrate_engine
    source = Table('source', meta, autoload=True)

    ORid = Column("ORid", BigInteger)
    ORid.create(source)

    ORoperations = Column("ORoperations", MutableDict.as_mutable(JSONType), default=dict)
    ORoperations.create(source)

    prefuncs = Column("prefuncs", MutableDict.as_mutable(JSONType), default=dict)
    prefuncs.create(source)

    data = Column("data", MutableDict.as_mutable(JSONType), default=dict)
    data.create(source)

    mapping = Column("mapping", MutableDict.as_mutable(JSONType), default=dict)
    mapping.create(source)

    name = Column("name", Unicode(255))
    name.create(source)

    dataset = Table('dataset', meta, autoload=True)

    ORid = Column("ORid", BigInteger)
    ORid.create(dataset)

    ORoperations = Column("ORoperations", MutableDict.as_mutable(JSONType), default=dict)
    ORoperations.create(dataset)

    prefuncs = Column("prefuncs", MutableDict.as_mutable(JSONType), default=dict)
    prefuncs.create(dataset)

    mapping = Column("mapping", MutableDict.as_mutable(JSONType), default=dict)
    mapping.create(dataset)

    pass


def downgrade(migrate_engine):
    # Operations to reverse the above upgrade go here.
    pass
