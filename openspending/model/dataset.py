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
from openspending.model.metadataorg import MetadataOrg
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
    __searchable__ = ['label', 'description']

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

    dataorg_id = Column(Integer, ForeignKey('dataorg.id'))
    dataorg = relationship(DataOrg,
                           backref=backref('datasets', lazy='dynamic'))

    metadataorg_id = Column(Integer, ForeignKey('metadataorg.id'))
    metadataorg = relationship(MetadataOrg,
                           backref=backref('datasets', lazy='dynamic'))
                           
    years = Column(Unicode(1000))
    
    stats = Column(Unicode(50))
    
    update_freq = Column(Unicode(255))
    orgurl = Column(Unicode(500))
    units = Column(Unicode(255))
    
    webservice = Column(Unicode(500))
    agency = Column(Unicode(255))
    organization = Column(Unicode(255))
    notes = Column(Unicode(4000))
    update_cycle = Column(Unicode(255))
    definition = Column(Unicode(4000))
    #TODO
    #tag stuff




    def __init__(self, data = None):
        if data == None:
            return
        self.label = data.get('label')
        if (data.get('name', None)):
            self.name = slugify(str(data.get('name')), max_length=30, separator="_")
        else:
            self.name = slugify(str(data.get('label')), max_length=30, separator="_")

        #check if name is already taken
        if Dataset.by_name(self.name):
            for x in range(10):
                newname = self.name + "_" + str(x)
                if not Dataset.by_name(newname):
                    self.name = newname
                    break


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

    #def get_count_query(self):
    #    return self.session.query(func.count(dataType))
    
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

    @property 
    def tags_str(self):
        output = []
        for t in self.tags:
            output.append(str(t))
        return ",".join(output)


        

    def touch(self):
        """ Update the dataset timestamp. This is used for cache
        invalidation. """
        self.updated_at = datetime.utcnow()
        db.session.add(self)



    def __repr__(self):
        return "%s (%s)" % (self.label, self.id, )

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
        self.stats = data.get('stats')

    def as_dict(self):
        the_years=[]
        load_status = "Need Source"
        source_url=""
        if self.source:
            load_status = self.source.load_status
            source_url = self.source.url
        dataset_dict=None
        if self.dataorg:
            dataset_dict=self.dataorg.label
        if self.years:
            the_years=self.years.split(",")
            the_years=map(int,the_years)
            the_years.sort()
        return {
            'label': self.label,
            'name': self.name,
            'description': self.description,
            'dataType': self.dataType,
            'dataorg': dataset_dict,
            'has_data': self.has_data,
            'source': self.source_id,
            'status': load_status,
            'years':the_years,
            'stats':self.stats,
            'url':source_url
        }


    def detailed_dict(self):
        the_years=[]
        source_url=""
        if self.source:
            source_url = self.source.url
        dataorg_dict=None
        metadataorg_dict=None
        if self.dataorg:
            dataorg_dict=self.dataorg.label
        if self.metadataorg:
            metadataorg_dict=self.metadataorg.label
        if self.years:
            the_years=self.years.split(",")
            the_years=map(int,the_years)
            the_years.sort()
        return {
            'label': self.label,
            'name': self.name,
            'description': self.description,
            'dataType': self.dataType,
            'dataorg': dataorg_dict,
            'metadataorg': metadataorg_dict,
            'created_at': self.created_at,
            'years':the_years,
            'url':self.orgurl,
            'units':self.units,
            'notes':self.definition,
            'datalastupdated':self.datalastupdated
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




