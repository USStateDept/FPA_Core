from sqlalchemy import *
from migrate import *
from datetime import datetime
from openspending.model.common import MutableDict, JSONType
meta = MetaData()


def upgrade(migrate_engine):
    # Upgrade operations go here. Don't create your own engine; bind
    # migrate_engine to your metadata
    meta.bind = migrate_engine

    settings = Table('forum_settings', meta,
                Column('key', String(255), primary_key=True),
                Column('value', PickleType, nullable=False),
                Column('name', String(200), nullable=False),
                Column('description', Text, nullable=False),
                Column('value_type', String(20), nullable=False),
                Column('extra', PickleType),
                Column('settingsgroup', String,
                              ForeignKey('forum_settingsgroup.key',
                                            use_alter=True,
                                            name="fk_settingsgroup"),
                              nullable=False))
    settings.create()

    settingsgroup = Table('forum_settingsgroup', meta,
                    Column('key', String(255), primary_key=True),
                    Column('name', String(255), nullable=False),
                    Column('description', Text, nullable=False))

    settingsgroup.create()




    pass




def downgrade(migrate_engine):
    # Operations to reverse the above upgrade go here.
    pass
