from datetime import datetime
import json

from sqlalchemy.orm import relationship, backref, reconstructor
from sqlalchemy.schema import Column, ForeignKey
from sqlalchemy.types import Integer, Unicode, DateTime
from sqlalchemy import BigInteger

from openspending.core import db
from openspending.model.common import MutableDict, JSONType
#from openspending.model.dataset import Dataset
#from openspending.model.account import Account
from openspending.model.model import Model

from openspending.preprocessors.ORhelper import RefineProj


class Source(db.Model):
    __tablename__ = 'source'

    id = Column(Integer, primary_key=True)
    name = Column(Unicode(255))
    #label = Column(Unicode(2000))
    #description = Column(Unicode())
    url = Column(Unicode)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, onupdate=datetime.utcnow)

    ORid = Column(BigInteger)




    def __init__(self, dataset=None, url=None, name=None, rawfile= None):
        #required for WTForms
        if dataset == None:
            return
        #copy the raw data 
        self.dataset = dataset
        self.url = url
        #backref to SourceFile
        self.rawfile = rawfile
        self.name = name

        #let's not do this yet

        # refineproj = self.get_or_create_ORProject()
        # self.ORid = refineproj.refineproj.project_id
        # if (dataset.mapping):
        #     self.addData(dataset.mapping)

    def get_or_create_ORProject(self):
        return RefineProj(source=self)

    def get_ORexport(self):
        refineproj = RefineProj(source=self)
        return refineproj.refineproj.export() 

    # def saveORInstructions(self):
    #     #get the new ioperations from OR and save them int he database
    #     refineproj = RefineProj(source=self)
    #     self.ORoperations = refineproj.get_operations()
    #     return

    def applyORInstructions(self, ORoperations):
        refineproj = self.get_or_create_ORProject()
        if 'data' not in ORoperations.keys():
            print "got OR instrutions without data"
            return False
        #check this ia valid or operations with the operations attr
        myoperations = []
        for op in ORoperations['data']:
            myoperations.append(op['operation'])
        data = {'operations': json.dumps(myoperations)}
        #data = {'operations': json.dumps(ORoperations['data'])}
        refineproj.refineproj.do_json("apply-operations", data=data)
        return True

    def getORInstructions(self):
        #get the new ioperations from OR and save them int he database
        refineproj = RefineProj(source=self)
        return refineproj.refineproj.get_operations()
        
    def getPreFuncs(self):
        if len(self.dataset.prefuncs.keys()):
            return self.dataset.prefuncs.get("data", [])
        else:
            return []


    def addData(self, mapping):
        self.dataset.mapping = mapping.copy()
        self._load_model()


    @reconstructor
    def _load_model(self):
        if not self.dataset:
            print "not dataset attached"
            return
        if len(self.dataset.mapping.get('data', {}).keys()) > 0:
            print "building the model", self.name
            self.model = Model(self)

    def delete(self):
        refineproj = self.get_or_create_ORProject()
        refineproj.refineproj.delete()

        #delete the source data from the tables

        db.session.delete(self)
        db.session.commit()


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
        if not len(self.dataset.mapping.get('data', {}).keys()):
            return False
        # There can be no errors in the analysis of the source

        #replace with logs
        # if 'error' in self.analysis:
        #     return False
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
        return "<Source(%s,%r,%s)>" % (self.name, self.id)

    @classmethod
    def by_id(cls, id):
        return db.session.query(cls).filter_by(id=id).first()

    @classmethod
    def by_source_name(cls, sourcename):
        return db.session.query(cls).filter(cls.name==sourcename).first()


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

    def __unicode__(self):
        return "<Source Model Name:" + self.name + ">"

