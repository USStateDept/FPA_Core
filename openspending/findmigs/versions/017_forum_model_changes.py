from sqlalchemy import *
from migrate import *
from datetime import datetime
from openspending.model.common import MutableDict, JSONType
meta = MetaData()


def upgrade(migrate_engine):
    # Upgrade operations go here. Don't create your own engine; bind
    # migrate_engine to your metadata
    meta.bind = migrate_engine
    try:
        account = Table('account', meta, autoload=True)
        moderator= Column('moderator', Boolean, default=False)

        moderator.create(account)
    except Exception, e:
        print "----------moderator column not created"
        print "messsage", e
        pass



    try:
        topicsread = Table('forum_topicsread', meta,
                            Column('user_id', Integer, ForeignKey("account.id"),
                            primary_key=True),
                            Column('topic_id', Integer,
                             ForeignKey("forum_topics.id", use_alter=True,
                                           name="fk_tr_topic_id"),
                             primary_key=True),
                            Column('forum_id', Integer,
                             ForeignKey("forum_forums.id", use_alter=True,
                                           name="fk_tr_forum_id"),
                             primary_key=True),
                            Column('last_read', DateTime, default=datetime.utcnow()))
        topicsread.create()
    except Exception, e:
        print "----------moderators not created with message", e


    try:
        forumsread = Table('forum_forumsread', meta, 
                            Column('user_id', Integer, ForeignKey("account.id"), primary_key=True),
                            Column('forum_id', Integer,
                             ForeignKey("forum_forums.id", use_alter=True,
                                           name="fk_fr_forum_id"),
                             primary_key=True),
                            Column('last_read',DateTime, default=datetime.utcnow()),
                            Column('cleared', DateTime)
                            )
        forumsread.create()
    except Exception, e:
        print "----------moderators not created with message", e



    try:
        posts= Table('forum_posts', meta,
            Column('id', Integer, primary_key=True),
            Column('topic_id', Integer,
                                 ForeignKey("forum_topics.id",
                                               use_alter=True,
                                               name="fk_post_topic_id",
                                               ondelete="CASCADE")),
            Column('user_id', Integer, ForeignKey("account.id"), nullable=True),
            Column('username', String(200), nullable=False),
            Column('content', Text, nullable=False),
            Column('date_created', DateTime, default=datetime.utcnow()),
            Column('date_modified', DateTime),
            Column('modified_by', String(200))
            )
        posts.create()
    except Exception, e:
        print "----------moderators not created with message", e


    try:
        report = Table('forum_reports', meta,
                        Column('id', Integer, primary_key=True),
                        Column('reporter_id', Integer, ForeignKey("account.id"),
                                                nullable=False),
                        Column('reported', DateTime, default=datetime.utcnow()),
                        Column('post_id', Integer, ForeignKey("forum_posts.id"), nullable=False),
                        Column('zapped', DateTime),
                        Column('zapped_by', Integer, ForeignKey("account.id")),
                        Column('reason', Text) )
        report.create()
    except Exception, e:
        print "----------moderators not created with message", e

    try:
        topics = Table('forum_topics', meta,
            Column('id', Integer, primary_key=True),
            Column('forum_id', Integer,
                                 ForeignKey("forum_forums.id",
                                               use_alter=True,
                                               name="fk_topic_forum_id"),
                                 nullable=False),
            Column('title', String(255), nullable=False),
            Column('user_id', Integer, ForeignKey("account.id")),
            Column('username', String(200), nullable=False),
            Column('date_created', DateTime, default=datetime.utcnow()),
            Column('last_updated', DateTime, default=datetime.utcnow()),
            Column('locked', Boolean, default=False),
            Column('important', Boolean, default=False),
            Column('views', Integer, default=0),
            Column('post_count', Integer, default=0),
            Column('first_post_id', Integer, ForeignKey("forum_posts.id",
                                                                ondelete="CASCADE")),
            Column('last_post_id', Integer, ForeignKey("forum_posts.id")))

        topics.create()
    except Exception, e:
        print "----------moderators not created with message", e


    try:
        categories= Table('forum_categories', meta,
            Column('id', Integer, primary_key=True),
            Column('title', String(255), nullable=False),
            Column('description', Text),
            Column('position', Integer, default=1, nullable=False))
        categories.create()
    except Exception, e:
        print "--------moderators not created with message", e

    try:
        forums = Table('forum_forums', meta,
            Column('id', Integer, primary_key=True),
            Column('category_id', Integer, ForeignKey("forum_categories.id"),
                                    nullable=False),
            Column('title', String(255), nullable=False),
            Column('description', Text),
            Column('position', Integer, default=1, nullable=False),
            Column('locked', Boolean, default=False, nullable=False),
            Column('show_moderators', Boolean, default=False, nullable=False),
            Column('external', String(200)),
            Column('post_count', Integer, default=0, nullable=False),
            Column('topic_count', Integer, default=0, nullable=False),
            Column('last_post_id', Integer, ForeignKey("forum_posts.id")),
            Column('last_post_title', String(255)),
            Column('last_post_user_id', Integer, ForeignKey("account.id")),
            Column('last_post_username', String(255)),
            Column('last_post_created', DateTime, default=datetime.utcnow()))
        forums.create()
    except Exception, e:
        print "----------moderators not created with message", e


    try:
        moderators = Table(
            'forum_moderators', meta, 
            Column('user_id', Integer(), ForeignKey('account.id'),
                      nullable=False),
            Column('forum_id', Integer(),
                      ForeignKey('forum_forums.id', use_alter=True, name="fk_forum_id"),
                      nullable=False))
        moderators.create()
    except Exception, e:
        print "----------moderators not created with message", e


    try:
        topictracker = Table(
            'forum_topictracker', meta, 
            Column('user_id', Integer(), ForeignKey('account.id'),
                      nullable=False),
            Column('forum_topic_id', Integer(),
                      ForeignKey('forum_topics.id',
                                    use_alter=True, name="fk_tracker_topic_id"),
                      nullable=False))

        topictracker.create()
    except Exception, e:
        print "----------moderators not created with message", e

    pass


def downgrade(migrate_engine):
    # Operations to reverse the above upgrade go here.
    pass







