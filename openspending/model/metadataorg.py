from datetime import datetime
from sqlalchemy.orm import reconstructor, relationship, backref
from sqlalchemy.schema import Column, ForeignKey
from sqlalchemy.types import Integer, Unicode, Boolean, DateTime
from sqlalchemy import BigInteger
from sqlalchemy.sql.expression import false, or_
from sqlalchemy.ext.associationproxy import association_proxy

from openspending.core import db




class MetadataOrg(db.Model):

    """ The dataset is the core entity of any access to data. All
    requests to the actual data store are routed through it, as well
    as data loading and model generation.

    The dataset keeps an in-memory representation of the data model
    (including all dimensions and measures) which can be used to
    generate necessary queries.
    """
    __tablename__ = 'metadataorg'

    id = Column(Integer, primary_key=True)
    label = Column(Unicode(2000))
    description = Column(Unicode())
    contactName = Column(Unicode(2000))
    contactEmail = Column(Unicode(2000))

    accessLevel  = Column(Unicode(2000))

    bureauCode = Column(Unicode(2000))

    lastUpdated =  Column(DateTime, onupdate=datetime.utcnow)

    #terms tags to be added
    #ref to tags table



    def __init__(self, metadata = None):
        if not metadata:
            return
        self.label = metadata.get('label')
        self.description = metadata.get('description')
        self.contactName = metadata.get('contactName')
        self.contactEmail = metadata.get('contactEmail')
        self.accessLevel = metadata.get('accessLevel')
        self.bureauCode = metadata.get('bureauCode')
        


    def touch(self):
        """ Update the dataset timestamp. This is used for cache
        invalidation. """
        self.lastUpdated = datetime.utcnow()
        db.session.add(self)



    def __repr__(self):
        return "<MetadataOrg(%r,%r)>" % (self.id, self.label)

    def update(self, metadata):
        self.label = metadata.get('label')
        self.description = metadata.get('description')
        self.contactName = metadata.get('contactName')
        self.contactEmail = metadata.get('contactEmail')
        self.accessLevel = metadata.get('accessLevel')
        self.bureauCode = metadata.get('bureauCode')
        self.lastUpdated = datetime.utcnow()

    def as_dict(self):
        return {
            'label': self.label,
            'description': self.description,
            'contactName' : self.contactName,
            'contactEmail' : self.contactEmail,
            'accessLevel' : self.accessLevel,
            'bureauCode' : self.bureauCode,
            'lastUpdated' : self.lastUpdated
        }

    def to_json_dump(self):
        """ Returns a JSON representation of an SQLAlchemy-backed object.
        """

        json = {}
        json['fields'] = {}
        json['pk'] = getattr(self, 'id')
        json['model'] = "MetadataOrg"

        fields = ['label','description','contactName','contactEmail','accessLevel','bureauCode']

        for field in fields:
            json['fields'][field] = getattr(self, field)

     
        return json

    @classmethod
    def import_json_dump(cls, theobj):
        fields = ['label','description','contactName','contactEmail','accessLevel','bureauCode']
        classobj = cls()
        for field in fields:
            setattr(classobj, field, theobj['fields'][field])

        db.session.add(classobj)
        db.session.commit()
        return classobj.id


        #return the id


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