from datetime import datetime
from sqlalchemy.orm import reconstructor, relationship, backref
from sqlalchemy.schema import Column, ForeignKey
from sqlalchemy.types import Integer, Unicode, Boolean, DateTime
from sqlalchemy import BigInteger
from sqlalchemy.sql.expression import false, or_
from sqlalchemy.ext.associationproxy import association_proxy

from openspending.core import db

from openspending.model.source import Source
from openspending.model.dataorg import DataOrg
#from openspending.model import Source, Account, DataOrg
from openspending.model.common import (MutableDict, JSONType,
                                       DatasetFacetMixin)

from slugify import slugify


class Dataset(db.Model):

    """ The dataset is the core entity of any access to data. All
    requests to the actual data store are routed through it, as well
    as data loading and model generation.

    """
    __tablename__ = 'dataset'

    id = Column(Integer, primary_key=True)
    name = Column(Unicode(255), unique=True)
    label = Column(Unicode(2000))
    description = Column(Unicode())


    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow,
                        onupdate=datetime.utcnow)

    datalastupdated = Column(DateTime, default=datetime.utcnow)


    source_id = Column(Integer, ForeignKey('source.id'))
    source = relationship(Source, backref=backref("dataset", uselist=False))

    mapping = Column(MutableDict.as_mutable(JSONType), default=dict)

    ORoperations = Column( MutableDict.as_mutable(JSONType), default=dict)

    prefuncs = Column(MutableDict.as_mutable(JSONType), default=dict)

    dataType = Column(Unicode(2000))

    published = Column(Boolean, default=False)

    loaded = Column(Boolean, default=False)

    tested = Column(Boolean, default=False)

    # creator_id = Column(Integer, ForeignKey('account.id'))
    # creator = relationship(Account,
    #                        backref=backref('datasets', lazy='dynamic'))

    dataorg_id = Column(Integer, ForeignKey('dataorg.id'))
    dataorg = relationship(DataOrg,
                           backref=backref('datasets', lazy='dynamic'))

    #TODO
    #tag stuff




    def __init__(self, data = None):
        if data == None:
            return
        self.label = data.get('label')
        if (data.get('name', None)):
            self.name = slugify(data.get('name'), max_length=50)
        else:
            self.name = slugify(data.get('label'), max_length=50)

        self.description = data.get('description')
        self.ORoperations = data.get('ORoperations', {})
        self.mapping = data.get('mapping', {})
        self.prefuncs = data.get('prefuncs', {})
        self.created_at = data.utcnow()
        self.dataorg = data.get('dataorg')


    def createSource(self, data):
        return


        

    def touch(self):
        """ Update the dataset timestamp. This is used for cache
        invalidation. """
        self.updated_at = datetime.utcnow()
        db.session.add(self)



    def __repr__(self):
        return "<Dataset(%r,%r)>" % (self.id, self.name)

    def update(self, dataset):
        self.label = dataset.get('label')
        self.name = dataset.get('name')
        self.private = dataset.get('private')
        self.description = dataset.get('description')
        self.currency = dataset.get('currency')
        self.category = dataset.get('category')
        self.default_time = dataset.get('default_time')
        self.languages = dataset.get('languages', [])
        self.territories = dataset.get('territories', [])

    def as_dict(self):
        return {
            'label': self.label,
            'name': self.name,
            'description': self.description,
            'default_time': self.default_time,
            'schema_version': self.schema_version,
            'currency': self.currency,
            'category': self.category,
            'serp_title': self.serp_title,
            'serp_teaser': self.serp_teaser,
            'timestamps': {
                'created': self.created_at,
                'last_modified': self.updated_at
            },
            'languages': list(self.languages),
            'territories': list(self.territories),
            'badges': [b.as_dict(short=True) for b in self.badges]
        }

    @classmethod
    def all_by_account(cls, account, order=True):
        """ Query available datasets based on dataset visibility. """
        from openspending.model.account import Account
        #limit to certain published/loaded/tested
        criteria = []
        if isinstance(account, Account) and account.is_authenticated():
            criteria += ["1=1" if account.admin else "1=2",
                         cls.managers.any(Account.id == account.id)]
        q = db.session.query(cls).filter(or_(*criteria))
        if order:
            q = q.order_by(cls.label.asc())
        return q

    @classmethod
    def get_all_admin(cls, order=True):
        """ Query available datasets based on dataset visibility. """
        q = db.session.query(cls)
        if order:
            q = q.order_by(cls.label.asc())
        return q

    @classmethod
    def by_name(cls, name):
        return db.session.query(cls).filter_by(name=name).first()

