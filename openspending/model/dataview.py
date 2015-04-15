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
from openspending.model import Account
from openspending.model.common import (MutableDict, JSONType,
                                       DatasetFacetMixin)


dataview_dataset_table = Table(
    'dataview_dataset', db.metadata,
    Column('dataview_id', Integer, ForeignKey('dataview.id'),
           primary_key=True),
    Column('dataset_id', Integer, ForeignKey('dataset.id'),
           primary_key=True)
)

def make_uuid():
    return unicode(uuid.uuid4())

class Dataview(db.Model):

    """ The dataset is the core entity of any access to data. All
    requests to the actual data store are routed through it, as well
    as data loading and model generation.

    """
    __tablename__ = 'dataview'

    id = Column(Integer, primary_key=True)
    title = Column(Unicode(500))
    description = Column(Unicode())


    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow,
                        onupdate=datetime.utcnow)

    urlhash = Column(Unicode(2000), default=make_uuid)

    datasets = relationship(Dataset,
                            secondary=dataview_dataset_table,
                            backref=backref('dataviews', lazy='dynamic'))

    account_id = Column(Integer, ForeignKey('account.id'))
    account = relationship(Account, backref=backref("dataviews", uselist=False))

    cloned_dataview_id = Column(Integer, ForeignKey('dataview.id'))
    cloned_dataview = relationship(self, backref=backref("clones", lazy='dynamic'))

    settings = Column(MutableDict.as_mutable(JSONType), default=dict)


    def __init__(self, data = None):
        if data == None:
            return
        self.label = data.get('label')
        if (data.get('name', None)):
            self.name = slugify(str(data.get('name')), max_length=30, separator="_")
        else:
            self.name = slugify(str(data.get('label')), max_length=30, separator="_")

        self.description = data.get('description')
        self.ORoperations = data.get('ORoperations', {})
        self.mapping = data.get('mapping', {})
        self.prefuncs = data.get('prefuncs', {})
        self.created_at = datetime.utcnow()
        self.dataType = data.get('dataType')
        if type(data.get('dataorg')) == int:
            self.dataorg = DataOrg.by_id(data.get('dataorg'))
        else:
            try:
                self.dataorg = data.get('dataorg')
            except Exception, e:
                print "failed to load the dataorg for dataset"
                print e


    def to_json_dump(self):
        """ Returns a JSON representation of an SQLAlchemy-backed object.
        """

        json = {}
        json['fields'] = {}
        json['pk'] = getattr(self, 'id')
        json['model'] = "Dataset"

        fields = ['name', 'label', 'description', 
                 'source_id', 'mapping', 'ORoperations', 'prefuncs', 'dataType','published','loaded', 'tested','dataorg_id']

        for field in fields:
            json['fields'][field] = getattr(self, field)

     
        return json


    @classmethod
    def import_json_dump(cls, theobj):
        fields = ['name', 'label', 'description', 
                 'source_id', 'mapping', 'ORoperations', 'prefuncs', 'dataType','published','loaded', 'tested','dataorg_id']
        classobj = cls()
        for field in fields:
            setattr(classobj, field, theobj['fields'][field])

        db.session.add(classobj)
        db.session.commit()

        return classobj.id




    @property 
    def has_data(self):
        if self.source_id:
            return True
        else:
            return False


        

    def touch(self):
        """ Update the dataset timestamp. This is used for cache
        invalidation. """
        self.updated_at = datetime.utcnow()
        db.session.add(self)



    def __repr__(self):
        return "<Dataset(%r,%r)>" % (self.id, self.name)

    def update(self, data):
        #not to update name
        self.label = data.get('label')
        if (data.get('name', None)):
            self.name = slugify(str(data.get('name')), max_length=30, separator="_")
        else:
            self.name = slugify(str(data.get('label')), max_length=30, separator="_")
        self.description = data.get('description')
        self.dataType = data.get('dataType')
        self.dataorg = DataOrg.by_id(data.get('dataorg'))


    def as_dict(self):
        load_status = "Need Source"
        if self.source:
            load_status = self.source.load_status
        return {
            'label': self.label,
            'name': self.name,
            'description': self.description,
            'dataType': self.dataType,
            'dataorg': self.dataorg_id,
            'has_data': self.has_data,
            'source': self.source_id,
            'status': load_status
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
    def all(cls, order=True):
        """ Query available datasets based on dataset visibility. """
        q = db.session.query(cls)
        if order:
            q = q.order_by(cls.label.asc())
        return q

    @classmethod
    def by_name(cls, name):
        return db.session.query(cls).filter_by(name=name).first()


    @classmethod
    def by_label(cls, label):
        return db.session.query(cls).filter_by(label=label).first()

    @classmethod
    def by_id(cls, id):
        return db.session.query(cls).filter_by(id=id).first()

