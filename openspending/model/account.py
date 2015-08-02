import colander
import uuid
import hmac

from flask import url_for
from flask.ext.login import AnonymousUserMixin
from sqlalchemy.orm import relationship, backref
from sqlalchemy.schema import Table, Column, ForeignKey
from sqlalchemy.types import Integer, Unicode, Boolean

from openspending.core import db, login_manager
from openspending.model.dataset import Dataset
from openspending.forum.forum.models import (Post, Topic, topictracker, TopicsRead,
                                  ForumsRead)

REGISTER_NAME_RE = r"^[a-zA-Z0-9_\-]{3,255}$"


def make_uuid():
    return unicode(uuid.uuid4())


account_dataset_table = Table(
    'account_dataset', db.metadata,
    Column('dataset_id', Integer, ForeignKey('dataset.id'),
           primary_key=True),
    Column('account_id', Integer, ForeignKey('account.id'),
           primary_key=True)
)


class AnonymousAccount(AnonymousUserMixin):
    """
    If I am an Anon User, I have not logged in to view
    the site nor have I logged in to get the 
    extended features
    """
    admin = False

    def is_anonymous(self):
        return True

    def __repr__(self):
        return '<AnonymousAccount()>'

login_manager.anonymous_user = AnonymousAccount




class LockdownUser():
    """
    If I am a LockdownUser, I have access to view the site,
    but I am technically not authenticated
    This is for dev only.  When it is production, the public
    can see and this will be turned off.
    """

    def is_authenticated(self):
        return True
    def is_active(self):
        return True
    def is_anonymous(self):
        return False
    def get_id(self):
        return 999999999
    @property 
    def is_lockdownuser(self):
        return True
    @property
    def admin(self):
        False
    @property 
    def id(self):
        return 999999999




@login_manager.user_loader
def load_account(account_id):
    if account_id == 999999999 or account_id=='all':
        return LockdownUser()
    return Account.by_id(account_id)


class Account(db.Model):
    __tablename__ = 'account'

    id = Column(Integer, primary_key=True)

    fullname = Column(Unicode(2000))

    email = Column(Unicode(2000), unique=True)
    password = Column(Unicode(2000))
    api_key = Column(Unicode(2000), default=make_uuid)
    admin = Column(Boolean, default=False)

    moderator= Column(Boolean, default=False)

    verified = Column(Boolean, default=False) 

    #use this in the future to mark based on domain
    usg_group = Column(Unicode(2000))

    login_hash = Column(Unicode(2000), default=make_uuid)

    datasets = relationship(Dataset,
                            secondary=account_dataset_table,
                            backref=backref('managers', lazy='dynamic'))


    #forus

    website = db.Column(db.String(200))
    location = db.Column(db.String(100))
    post_count = db.Column(db.Integer, default=0)

    posts = db.relationship("Post", backref="user", lazy="dynamic")
    topics = db.relationship("Topic", backref="user", lazy="dynamic")


    tracked_topics = \
            db.relationship("Topic", secondary=topictracker,
                            primaryjoin=(topictracker.c.user_id == id),
                            backref=db.backref("topicstracked", lazy="dynamic"),
                            lazy="dynamic")

    def __init__(self):
        self.api_key = make_uuid()

    def is_authenticated(self):
        return True

    def is_active(self):
        return True

    def get_id(self):
        return self.id

    def reset_loginhash(self):
        self.login_hash = make_uuid()
        

    @property
    def display_name(self):
        return self.fullname

    @property
    def token(self):
        h = hmac.new('')
        h.update(self.api_key)
        if self.password:
            h.update(self.password)
        return h.hexdigest()

    #helper for forums
    @property 
    def username(self):
        return self.fullname
 
    def is_anonymous(self):
        return False


    #forums


    # Properties
    @property
    def last_post(self):
        """Returns the latest post from the user"""

        return Post.query.filter(Post.user_id == self.id).\
            order_by(Post.date_created.desc()).first()

    @property
    def url(self):
        """Returns the url for the user"""
        #change to public user page
        return url_for("user.dataloader")
        #return url_for("account.profile", username=self.username)

    @property
    def permissions(self):
        """Returns the permissions for the user"""
        return self.get_permissions()


    @property
    def days_registered(self):
        """Returns the amount of days the user is registered."""
        days_registered = (datetime.utcnow() - self.date_joined).days
        if not days_registered:
            return 1
        return days_registered

    @property
    def topic_count(self):
        """Returns the thread count"""
        return Topic.query.filter(Topic.user_id == self.id).count()

    @property
    def posts_per_day(self):
        """Returns the posts per day count"""
        return round((float(self.post_count) / float(self.days_registered)), 1)

    @property
    def topics_per_day(self):
        """Returns the topics per day count"""
        return round((float(self.topic_count) / float(self.days_registered)), 1)

    def recalculate(self):
        """Recalculates the post count from the user."""
        post_count = Post.query.filter_by(user_id=self.id).count()
        self.post_count = post_count
        self.save()
        return self

    def all_topics(self, page):
        """Returns a paginated result with all topics the user has created."""

        return Topic.query.filter(Topic.user_id == self.id).\
            filter(Post.topic_id == Topic.id).\
            order_by(Post.id.desc()).\
            paginate(page, flaskbb_config['TOPICS_PER_PAGE'], False)

    def all_posts(self, page):
        """Returns a paginated result with all posts the user has created."""

        return Post.query.filter(Post.user_id == self.id).\
            paginate(page, flaskbb_config['TOPICS_PER_PAGE'], False)

    def track_topic(self, topic):
        """Tracks the specified topic
        :param topic: The topic which should be added to the topic tracker.
        """

        if not self.is_tracking_topic(topic):
            self.tracked_topics.append(topic)
            return self

    def untrack_topic(self, topic):
        """Untracks the specified topic
        :param topic: The topic which should be removed from the
                      topic tracker.
        """

        if self.is_tracking_topic(topic):
            self.tracked_topics.remove(topic)
            return self

    def is_tracking_topic(self, topic):
        """Checks if the user is already tracking this topic
        :param topic: The topic which should be checked.
        """

        return self.tracked_topics.filter(
            topictracker.c.topic_id == topic.id).count() > 0


    #@cache.memoize(timeout=3600)
    def get_permissions(self, exclude=None):
        """Returns a dictionary with all the permissions the user has.
        :param exclude: a list with excluded permissions. default is None.
        """

        exclude = exclude or []
        exclude.extend(['id', 'name', 'description'])

        perms = {}
        return perms

    def invalidate_cache(self):
        """Invalidates this objects cached metadata."""
        return
        #cache.delete_memoized(self.get_permissions, self)

    def ban(self):
        """Bans the user. Returns True upon success."""
        #set value and invalid
        if not self.banned:
            self.banned = True
            db.session.commit()
            return True
        return False

    def unban(self):
        """Unbans the user. Returns True upon success."""

        if self.banned:
            self.banned = False
            db.session.commit()
            return True
        return False




    @classmethod
    def by_id(cls, id):
        return db.session.query(cls).filter_by(id=id).first()

    @classmethod
    def all(cls):
        return db.session.query(cls)

    @classmethod
    def by_email(cls, email):
        return db.session.query(cls).filter_by(email=email).first()

    @classmethod
    def by_api_key(cls, api_key):
        return db.session.query(cls).filter_by(api_key=api_key).first()

    @classmethod
    def by_login_hash(cls, login_hash):
        return db.session.query(cls).filter_by(login_hash=login_hash).first()

    def as_dict(self):
        """
        Return the dictionary representation of the account
        """

        # Dictionary will include name, fullname, email and the admin bit
        account_dict = {
            'fullname': self.fullname,
            'email': self.email,
            'admin': self.admin
        }


        # Return the dictionary representation
        return account_dict

    def __repr__(self):
        return '<Account(%r,%r)>' % (self.id, self.email)


class AccountRegister(colander.MappingSchema):

    fullname = colander.SchemaNode(colander.String())
    email = colander.SchemaNode(colander.String(),
                                validator=colander.Email())
    terms = colander.SchemaNode(colander.Bool())


class AccountSettings(colander.MappingSchema):
    fullname = colander.SchemaNode(colander.String())
    email = colander.SchemaNode(colander.String(),
                                validator=colander.Email())

    password1 = colander.SchemaNode(colander.String(),
                                    missing=None, default=None)
    password2 = colander.SchemaNode(colander.String(),
                                    missing=None, default=None)

