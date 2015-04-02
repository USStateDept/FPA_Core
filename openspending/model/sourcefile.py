from datetime import datetime

from sqlalchemy.orm import relationship, backref
from sqlalchemy.schema import Table, Column, ForeignKey
from sqlalchemy.types import Integer, Unicode, DateTime

from openspending.core import db, sourcefiles
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
    source = relationship(Source, backref=backref("rawfile", uselist=False, lazy='select'))


    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow,
                        onupdate=datetime.utcnow)

    def __init__(self, rawfile = None, source = None):
        """
        Initialize upload files

        """
        if rawfile == None:
            return

        self.rawfile = rawfile


    def __repr__(self):
        return "<SourceFile(%r, %r)>" % (self.id, self.rawfile,)

    def __unicode__(self):
        return "<SourceFile(%r, %r)>" % (self.id, self.rawfile,)


    def load_file(self):
        try:
            return open(sourcefiles.path(self.rawfile), 'rb')
        except Exception, e:
            print "cannot find the rawfile"



    @classmethod
    def all(cls):
        """
        Find all sourcefiles
        """
        return db.session.query(cls)

    def as_dict(self):
        """
        dict
        """
        badge = {
            "id": self.id,
            "rawfile": self.rawfile
        }