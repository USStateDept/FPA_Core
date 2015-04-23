from datetime import datetime

from sqlalchemy.orm import relationship, backref
from sqlalchemy.schema import Column, ForeignKey
from sqlalchemy.types import Integer, Unicode, Boolean, DateTime

from openspending.core import db
from openspending.model.common import MutableDict, JSONType


class Feedback(db.Model):

    """ A view stores a specific configuration of a visualisation widget. """

    __tablename__ = 'feedback'

    id = Column(Integer, primary_key=True)
    email = Column(Unicode(2000))
    created_at = Column(DateTime, default=datetime.utcnow)
    name = Column(Unicode(2000))

    url = Column(Unicode(2000))

    message = Column(Unicode())

    read = Column(Boolean, default=False) 


    def __init__(self):
        pass

    @classmethod
    def by_id(cls, id):
        return db.session.query(cls).filter_by(id=id).first()


    def __repr__(self):
        return "<View(%r,%r)>" % (self.name, self.created_at)
