import colander
import uuid
import hmac

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
    admin = False

    def __repr__(self):
        return '<AnonymousAccount()>'

login_manager.anonymous_user = AnonymousAccount




class LockdownUser():
    def is_authenticated(self):
        return True
    def is_active(self):
        return True
    def is_anonymous(self):
        return False
    def get_id(self):
        return 999999999
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

