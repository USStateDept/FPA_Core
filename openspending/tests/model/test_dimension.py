from nose.tools import assert_raises

from openspending.tests.helpers import model_fixture, load_fixture
from openspending.tests.base import DatabaseTestCase

from openspending.core import db
from openspending.model.dataset import Dataset
from openspending.tests.importer.test_OR import csvimport_fixture


class TestAttributeDimension(DatabaseTestCase):

    def setUp(self):
        super(TestAttributeDimension, self).setUp()
        source = csvimport_fixture("sci_study")
        self.source = source 
        self.model = source.data

        self.engine = db.engine
        self.meta = db.metadata
        self.meta.bind = self.engine

        self.field = self.source.model['amount']

    def test_is_compound(self):
        assert not getattr(self.field, "is_compound", None)


class TestCompoundDimension(DatabaseTestCase):

    def setUp(self):
        super(TestCompoundDimension, self).setUp()
        source = csvimport_fixture("sci_study")
        self.source = source 
        self.model = source.data

        self.engine = db.engine
        self.meta = db.metadata
        self.meta.bind = self.engine

        self.entity = self.source.model['country_level0']

    def test_is_compound(self):
        assert self.entity.is_compound

    def test_basic_properties(self):
        assert self.entity.name == 'country_level0', self.entity.name

    def test_generated_tables(self):
        assert hasattr(self.entity, 'table'), self.entity
        assert self.entity.table.name == 'sci_study__' + \
            self.entity.taxonomy, self.entity.table.name
        # assert hasattr(self.entity, 'alias')
        # print self.entity.name
        # assert self.entity.alias.name == self.entity.name, \
        #     self.entity.alias.name
        cols = self.entity.table.c
        assert 'id' in cols
        assert_raises(KeyError, cols.__getitem__, 'country_level0')

    def test_attributes_exist_on_object(self):
        assert len(self.entity.attributes) == 2, self.entity.attributes
        assert_raises(KeyError, self.entity.__getitem__, 'country_level0')
        assert self.entity['name'].name == 'name'
        assert self.entity['name'].datatype == 'id', self.entity['name'].datatype

    def test_attributes_exist_on_table(self):
        assert hasattr(self.entity, 'table'), self.entity
        assert 'name' in self.entity.table.c, self.entity.table.c
        assert 'label' in self.entity.table.c, self.entity.table.c

    # def test_members(self):
    #     members = list(self.entity.members())
    #     assert len(members) == 5, len(members)

    #     members = list(
    #         self.entity.members(
    #             self.entity.alias.c.name == 'Dept032'))
    #     assert len(members) == 1
