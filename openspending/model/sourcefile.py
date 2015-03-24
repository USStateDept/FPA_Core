from datetime import datetime

from sqlalchemy.orm import relationship, backref
from sqlalchemy.schema import Table, Column, ForeignKey
from sqlalchemy.types import Integer, Unicode, DateTime

from openspending.core import db
from openspending.model import Source




class SourceFile(db.Model):

    """
    This model allows marking datasets with various badges.
    Examples could be "World Bank" - data verified by the World bank.
    Each badge has a name, a representative image and a description.
    Also stored for historical reasons are badge creator, creation time
    and modification date.
    """
    __tablename__ = 'sourcefile'

    id = Column(Integer, primary_key=True)

    # Primary information for this badge
    rawfile = Column(Unicode)

    source_id = Column(Integer, ForeignKey('source.id'))
    source = relationship(Source, backref=backref("rawfile", uselist=False))


    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow,
                        onupdate=datetime.utcnow)

    def __init__(self, rawfile = None):
        """
        Initialize a badge object.
        Badge label should be a representative title for the badge
        Image should be a small, representative image for the badge
        Description describes the purpose of the badge in more detail
        Creator is the user who created the badge.
        """
        if rawfile == None:
            return

        self.rawfile = rawfile


    def __repr__(self):
        return "<SourceFile(%r)>" % (self.id,)



    @classmethod
    def all(cls):
        """
        Find all badges
        """
        return db.session.query(cls)

    def as_dict(self):
        """
        A dictionary representation of the badge. This can return a long
        version containing all interesting fields or a short version containing
        only id, label and image.
        """
        badge = {
            "id": self.id,
            "rawfile": self.rawfile
        }