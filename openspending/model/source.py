from datetime import datetime

from sqlalchemy.orm import relationship, backref, reconstructor
from sqlalchemy.schema import Column, ForeignKey
from sqlalchemy.types import Integer, Unicode, DateTime
from sqlalchemy import BigInteger

from openspending.core import db
from openspending.model.common import MutableDict, JSONType
from openspending.model.dataset import Dataset
from openspending.model.account import Account
from openspending.model.model import Model

from openspending.preprocessors.ORhelper import RefineProj


class Source(db.Model):
    __tablename__ = 'source'

    id = Column(Integer, primary_key=True)
    name = Column(Unicode(255))
    label = Column(Unicode(2000))
    description = Column(Unicode())
    url = Column(Unicode)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, onupdate=datetime.utcnow)
    analysis = Column(MutableDict.as_mutable(JSONType), default=dict)
    data = Column(MutableDict.as_mutable(JSONType), default=dict)

    ORid = Column(BigInteger)

    ORoperations = Column( MutableDict.as_mutable(JSONType), default=dict)

    prefuncs = Column(MutableDict.as_mutable(JSONType), default=dict)




    dataset_id = Column(Integer, ForeignKey('dataset.id'))
    dataset = relationship(
        Dataset,
        backref=backref('sources', lazy='dynamic',
                        order_by='Source.created_at.desc()'))

    creator_id = Column(Integer, ForeignKey('account.id'))
    creator = relationship(Account,
                           backref=backref('sources', lazy='dynamic'))

    def __init__(self, dataset, creator, url, name, data = None):
        #copy the raw data 
        self.dataset = dataset
        self.creator = creator
        self.url = url
        self.name = name
        self.label = name
        self.description = "Need to change this in the model"
        self.prefuncs = {}
        refineproj = self.get_or_create_ORProject()
        self.ORid = refineproj.refineproj.project_id
        if (data):
            self.addData(data)

    def get_or_create_ORProject(self):
        return RefineProj(source=self)

    def get_ORexport(self):
        refineproj = RefineProj(source=self)
        return refineproj.refineproj.export() 

    def saveORInstructions(self):
        #get the new ioperations from OR and save them int he database
        refineproj = RefineProj(source=self)
        self.ORoperations = refineproj.get_operations()
        return

    def getORInstructions(self):
        #get the new ioperations from OR and save them int he database
        refineproj = RefineProj(source=self)
        return refineproj.get_operations()
        

    def addData(self, data):
        self.data = data.copy()
        self._load_model()

    @reconstructor
    def _load_model(self):
        if self.data.get('mapping', {}).keys() > 0:
            print "building the model", self.name
            self.model = Model(self)


    @property
    def mapping(self):
        return self.data.get('mapping', {})

    @property
    def loadable(self):
        """
        Returns True if the source is ready to be imported into the
        database. Does not not require a sample run although it
        probably should.
        """
        # It shouldn't be loaded again into the database
        if self.successfully_loaded:
            return False
        # It needs mapping to be loadable
        if not len(self.dataset.mapping):
            return False
        # There can be no errors in the analysis of the source
        if 'error' in self.analysis:
            return False
        # All is good... proceed
        return True

    @property
    def successfully_sampled(self):
        """
        Returns True if any of this source's runs have been
        successfully sampled (a complete sample run). This shows
        whether the source is ready to be imported into the database
        """
        return True in [r.successful_sample for r in self.runs]

    @property
    def is_running(self):
        """
        Returns True if any of this source's runs have the status
        'running'. This shows whether the loading has been started or not
        to help avoid multiple loads of the same resource.
        """
        return True in [r.is_running for r in self.runs]

    @property
    def successfully_loaded(self):
        """
        Returns True if any of this source's runs have been
        successfully loaded (not a sample and no errors). This
        shows whether the source has been loaded into the database
        """
        return True in [r.successful_load for r in self.runs]

    def __repr__(self):
        return "<Source(%r,%s)>" % (self.id, self.url)

    @classmethod
    def by_id(cls, id):
        return db.session.query(cls).filter_by(id=id).first()

    @classmethod
    def by_source_name(cls, sourcename):
        return db.session.query(cls).join(cls.dataset).filter(cls.name==sourcename).first()


    @classmethod
    def all(cls):
        return db.session.query(cls)

    def as_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "url": self.url,
            "dataset": self.dataset.name,
            "created_at": self.created_at,
            "ORid": self.ORid
        }
