
from sqlalchemy.orm import relationship, backref
from sqlalchemy.schema import Table, Column, ForeignKey
from sqlalchemy.types import Integer, Unicode, Boolean

from openspending.core import db
from openspending.model import Dataset

from slugify import slugify

TAG_OPTIONS = [
    ("categories", "Categories"),
    ("subcategories", "Sub-Categories"),
    ("keyword", "Keywords"),
]





TAG_CATEGORIES = {
    "categories": "Categories",
    "subcategories": "Sub-Categories",
    "keyword": "Keywords",
}


REQ_TAGS = ["human_assistance",
            "peace_and_security",
            "democracy_human_rights_and_governance",
            "economic_development",
            "education_and_social_services",
            "health",
            "program_management",
            "multi_sector",
            "environment"]




tags_dataset_table = Table(
    'tags_dataset', db.metadata,
    Column('dataset_id', Integer, ForeignKey('dataset.id'),
           primary_key=True),
    Column('tags_id', Integer, ForeignKey('tags.id'),
           primary_key=True)
)




class Tags(db.Model):
    __tablename__ = 'tags'

    id = Column(Integer, primary_key=True)



    slug_label = Column(Unicode(500))

    label = Column(Unicode(500))

    category = Column(Unicode(500), default="categories")

    datasets = relationship(Dataset,
                            secondary=tags_dataset_table,
                            backref=backref('tags', lazy='dynamic'))

    #self.name = slugify(str(data.get('label')), max_length=30, separator="_")


    def __init__(self, data={}):
        self.label = data.get('label')
        self.datasets = data.get('datasets',[])
        self.slug_label = slugify(str(data.get('label')), separator="_")
        self.category = data.get('category', "categories");


    @property 
    def dataset_count(self):
        datasets = []
        #rebuilds hte model.  Need to skip this in favor of a dataset obj
        for dataset in self.datasets:
            if dataset.source.loadable:
                datasets.append(dataset)
        return len(datasets)

    @classmethod
    def all_by_category(cls, category="categories"):
        return db.session.query(cls).filter_by(category=category)

    @classmethod
    def datasets_by_tag(cls, category="categories", slug_label=None):
        return db.session.query(cls).filter_by(category=category).filter_by(slug_label=slug_label).first()


    def as_dict(self):
        """
        Return the dictionary representation of the account
        """

        # Dictionary will include name, fullname, email and the admin bit
        tag = {
            'label': self.label,
            'slug_label': self.slug_label,
            'id': self.id,
            'dataset_count': self.dataset_count
        }


        # Return the dictionary representation
        return tag

    def __repr__(self):
        return '<Tag(%r,%r)>' % (self.label, self.category)


