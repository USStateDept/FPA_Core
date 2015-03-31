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
    account = Table('account', meta,
                    Column('id', Integer, primary_key=True),
                    Column('fullname', Unicode(2000)),
                    Column('email', Unicode(2000), unique=True),
                    Column('password', Unicode(2000)),
                    Column('api_key', Unicode(2000)),
                    Column('usg_group', Unicode(2000)),
                    Column('login_hash', Unicode(2000)),
                    Column('admin', Boolean, default=False),
                    Column('verified', Boolean, default=False) 
                    )

    account.create()


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

    metadataorg.create()





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


    dataorg.create()




    #####@###############Source


    source = Table('source', meta,
                    Column('id', Integer, primary_key=True),
                    Column('name', Unicode(255), unique=True),
                    Column('url', Unicode),
                    Column('created_at', DateTime, default=datetime.utcnow),
                    Column('updated_at', DateTime, default=datetime.utcnow,
                        onupdate=datetime.utcnow),
                    Column('ORid', BigInteger)
                    )



    source.create()



    ##################### SourceFile

    sourcefile = Table('sourcefile', meta,
                    Column('id', Integer, primary_key=True),
                    Column('rawfile', Unicode),
                    Column('source_id', Integer, ForeignKey('source.id')),
                    Column('created_at', DateTime, default=datetime.utcnow),
                    Column('updated_at', DateTime, default=datetime.utcnow,
                            onupdate=datetime.utcnow)  
                    )


    sourcefile.create()



    ####################Dataset


    dataset = Table('dataset', meta,
                    Column('id', Integer, primary_key=True),
                    Column('name', Unicode(255), unique=True),
                    Column('label', Unicode(2000)),
                    Column('description', Unicode),
                    Column('category', Unicode()),
                    Column('private', Boolean),
                    Column('created_at', DateTime, default=datetime.utcnow),
                    Column('updated_at', DateTime, default=datetime.utcnow,
                        onupdate=datetime.utcnow),
                    Column('datalastupdated', DateTime, default=datetime.utcnow),
                    Column('source_id', Integer, ForeignKey('source.id')),
                    Column('mapping', MutableDict.as_mutable(JSONType), default=dict),
                    Column('ORoperations', MutableDict.as_mutable(JSONType), default=dict),
                    Column('prefuncs', MutableDict.as_mutable(JSONType), default=dict),
                    Column('dataType', Unicode(2000)),
                    Column('published', Boolean, default=False),
                    Column('loaded', Boolean, default=False),
                    Column('tested', Boolean, default=False),
                    Column('dataorg_id', Integer, ForeignKey('dataorg.id'))
                    )

    dataset.create()



    ###########################Runs

    runs = Table('run', meta,
                Column('id', Integer, primary_key=True),
                Column('operation', Unicode(2000)),
                Column('status', Unicode(2000)),
                Column('time_start', DateTime, default=datetime.utcnow),
                Column('time_end', DateTime),
                Column('dataset_id', Integer, ForeignKey('dataset.id'), nullable=True),
                Column('source_id', Integer, ForeignKey('source.id'), nullable=True)
                )

    runs.create()



    ################## ManytoMany accounts to datasets
    account_dataset_table = Table(
        'account_dataset', meta,
        Column('dataset_id', Integer, ForeignKey('dataset.id'),
               primary_key=True),
        Column('account_id', Integer, ForeignKey('account.id'),
               primary_key=True)
    )

    account_dataset_table.create()


    pass


def downgrade(migrate_engine):
    # Operations to reverse the above upgrade go here.
    pass
