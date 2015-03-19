from sqlalchemy import *
from migrate import *
from openspending.model.common import MutableDict, JSONType
meta = MetaData()


def upgrade(migrate_engine):
   # Upgrade operations go here. Don't create your own engine; bind
    # migrate_engine to your metadata
    meta.bind = migrate_engine


    ##################MetadataOrg

    metadataorg = Table('metadataorg', meta, 
                            Column('id', Integer, primary_key=True),
                            Column('label', Unicode(2000)),
                            Column('description', Unicode()),
                            Column('contactName', Unicode(2000)),
                            Column('contactEmail', Unicode(2000)),

                            Column('accessLevel', Unicode(2000)),

                            Column('bureauCode', Unicode(2000)),

                            Column('lastUpdated', DateTime)
                        )
    try:
        metadataorg.create()
    except Exception, e:
        print "Skipped metadataorg", e




    ################## DataOrg

    dataorg = Table('dataorg', meta,
                    Column('id', Integer, primary_key=True),
                    Column('label', Unicode(2000)),
                    Column('description', Unicode()),
                    Column('ORTemplate', MutableDict.as_mutable(JSONType), default=dict),
                    Column('mappingTemplate', MutableDict.as_mutable(JSONType), default=dict),
                    Column('prefuncs', MutableDict.as_mutable(JSONType), default=dict),
                    Column('lastUpdated', DateTime),
                    Column('metadataorg_id', Integer, ForeignKey('metadataorg.id'))
                    )

    try:
        dataorg.create()
    except Exception, e:
        print "skipping dataorg", e


    ####################Dataset

    dataset = Table('dataset', meta, autoload=True)

    myset = []
    myset.append(Column('currency', Unicode()))
    myset.append(Column('default_time', Unicode()))
    myset.append(Column('schema_version', Unicode()))
    myset.append(Column('category', Unicode()))
    myset.append(Column('serp_title', Unicode()))
    myset.append(Column('serp_teaser', Unicode()))
    myset.append(Column('private', Boolean))


    for theset in myset:
        try:
            theset.drop(dataset)
        except Exception, e:
            print "skipping", e

    ####rename
    try:
        data = Column(MutableDict.as_mutable(JSONType), default=dict)
        data.alter('mapping', table=dataset, engine=migrate_engine)
    except Exception, e:
        print "skipping the rename", e


    ####adds
    myset = []

    myset.append(Column('source_id', Integer, ForeignKey('source.id')))
    myset.append(Column('dataType', Unicode(2000)))
    myset.append(Column('published', Boolean()))
    myset.append(Column('loaded', Boolean()))
    myset.append(Column('tested', Boolean()))
    myset.append(Column('dataorg_id', Integer, ForeignKey('dataorg.id')))
    myset.append(Column('datalastupdated', DateTime))

    for theset in myset:
        try:
            theset.create(dataset)
        except Exception, e:
            print "skipping the create", e



    ####################Source
    source = Table('source', meta, autoload=True)

    myset = []

    dataset = Table('dataset', meta, autoload=True)

    datcol = Column('data', MutableDict.as_mutable(JSONType), default=dict)
    try:
        datcol.alter('mapping', table=source, engine=migrate_engine)
    except Exception, e:
        print "skipping source mapping change", e



    pass


def downgrade(migrate_engine):
    # Operations to reverse the above upgrade go here.
    pass
