from datetime import datetime
from sqlalchemy.orm import reconstructor, relationship, backref
from sqlalchemy.schema import Column, ForeignKey
from sqlalchemy.types import Integer, Unicode, Boolean, DateTime
from sqlalchemy import BigInteger
from sqlalchemy.sql.expression import false, or_
from sqlalchemy.ext.associationproxy import association_proxy

from openspending.core import db

from openspending.model.metadataorg import MetadataOrg
from openspending.model.common import (MutableDict, JSONType,
                                       DatasetFacetMixin)


class DataOrg(db.Model):

    """ The dataset is the core entity of any access to data. All
    requests to the actual data store are routed through it, as well
    as data loading and model generation.

    The dataset keeps an in-memory representation of the data model
    (including all dimensions and measures) which can be used to
    generate necessary queries.
    """
    __tablename__ = 'dataorg'

    id = Column(Integer, primary_key=True)
    label = Column(Unicode(2000))
    description = Column(Unicode())
    
    ORTemplate = Column(MutableDict.as_mutable(JSONType), default=dict)

    mappingTemplate = Column(MutableDict.as_mutable(JSONType), default=dict)

    prefuncs = Column(MutableDict.as_mutable(JSONType), default=dict)

    lastUpdated =  Column(DateTime, onupdate=datetime.utcnow)



    metadataorg_id = Column(Integer, ForeignKey('metadataorg.id'))
    metadataorg = relationship(MetadataOrg,
                           backref=backref('dataorgs', lazy='dynamic'))




    def __init__(self, dataorg=None):
        if not dataorg:
            return
        self.label = dataorg.get('label')
        self.description = dataorg.get('description')
        self.ORTemplate = dataorg.get('ORTemplate', {})
        self.mappingTemplate = dataorg.get('mappingTemplate', {})
        self.prefuncs = dataorg.get('prefuncs', {})
        self.lastUpdated = datetime.utcnow()
        self.metadataorg = dataorg.get('metadataorg')



    def touch(self):
        """ Update the dataset timestamp. This is used for cache
        invalidation. """
        self.updated_at = datetime.utcnow()
        db.session.add(self)

    def to_json_dump(self):
        """ Returns a JSON representation of an SQLAlchemy-backed object.
        """

        json = {}
        json['fields'] = {}
        json['pk'] = getattr(self, 'id')
        json['model'] = "DataOrg"

        fields = ['label','description','ORTemplate','mappingTemplate','prefuncs','metadataorg_id']

        for field in fields:
            json['fields'][field] = getattr(self, field)

     
        return json

    @classmethod
    def import_json_dump(cls, theobj):
        
        fields = ['label','description','ORTemplate','mappingTemplate','prefuncs','metadataorg_id']
        classobj = cls()
        for field in fields:
            setattr(classobj, field, theobj['fields'][field])
            #classobj.set(field, theobj['fields'][field])

        db.session.add(classobj)
        db.session.commit()

        return classobj.id



    def __repr__(self):
        return "<DataOrg(%r,%r)>" % (self.id, self.label)

    def update(self, dataorg):
        self.label = dataset.get('label')
        self.description = dataset.get('description')
        self.ORTemplate = dataset.get('ORTemplate', {})
        self.mappingTemplate = dataset.get('mappingTemplate', {})
        self.prefuncs = dataset.get('prefuncs', {})
        self.lastUpdated = datetime.utcnow()
        self.metadataorg = dataset.get('metadataorg')

    def as_dict(self):
        return {
            'id' : self.id,
            'label': self.label,
            'description': self.description,
            'lastUpdated': self.lastUpdated,
            'metadataorg': self.metadataorg
        }


    @classmethod
    def get_all_admin(cls, order=True):
        """ Query available datasets based on dataset visibility. """
        q = db.session.query(cls)
        if order:
            q = q.order_by(cls.label.asc())
        return q

    @classmethod
    def get_all(cls, order=True):
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
    def by_name(cls, label):
        return db.session.query(cls).filter_by(label=label).first()

    @classmethod
    def by_id(cls, id):
        return db.session.query(cls).filter_by(id=id).first()


#TODO
# class MetadataOrgSettings(colander.MappingSchema):
#     fullname = colander.SchemaNode(colander.String())
#     email = colander.SchemaNode(colander.String(),
#                                 validator=colander.Email())
#     public_email = colander.SchemaNode(colander.Boolean(), missing=False)
#     twitter = colander.SchemaNode(colander.String(), missing=None,
#                                   validator=colander.Length(max=140))
#     public_twitter = colander.SchemaNode(colander.Boolean(), missing=False)
#     password1 = colander.SchemaNode(colander.String(),
#                                     missing=None, default=None)
#     password2 = colander.SchemaNode(colander.String(),
#                                     missing=None, default=None)
#     script_root = colander.SchemaNode(colander.String(),
#                                       missing=None, default=None)