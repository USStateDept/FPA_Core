from sqlalchemy import Integer, UnicodeText, Float, Unicode
from nose.tools import assert_raises

from openspending.tests.helpers import model_fixture, load_dataset
from openspending.tests.base import DatabaseTestCase

from openspending.core import db
from openspending.model.dataset import Dataset
from openspending.model import analytics
from openspending.model.dimension import (AttributeDimension, Measure,
                                          CompoundDimension, DateDimension)
from openspending.tests.importer.test_OR import csvimport_fixture


class TestDataset(DatabaseTestCase):

    def setUp(self):
        super(TestDataset, self).setUp()
        source = csvimport_fixture("sci_study")
        self.source = source 
        self.model = source.data
        # self.model = model_fixture('simple')
        # self.source = Dataset(self.model)

    # def test_load_model_properties(self):
    #     assert self.source.name == self.model['dataset']['name'], self.source.name
    #     assert self.source.label == self.model['dataset']['label'], self.source.label

    def test_load_model_dimensions(self):
        assert len(self.source.model.dimensions) == 2, self.source.model.dimensions
        assert isinstance(self.source.model['time'], DateDimension), \
            self.source.model['time']
        assert isinstance(
            self.source.model['amount'], Measure), self.source.model['amount']
        assert isinstance(self.source.model['country_level0'], CompoundDimension), \
            self.source.model['country_level0']
        assert len(self.source.model.measures) == 1, self.source.model.measures

    def test_value_dimensions_as_attributes(self):
        dim = self.source.model['country_level0']
        assert isinstance(dim.column.type, Integer), dim.column
        assert 'country_level0_id' == dim.column.name, dim.column
        assert dim.name == 'country_level0', dim.name

        # assert dim.source_column == self.model['mapping']['country_level0']['column'],\
        #     dim.source_column
        assert dim.label == self.model['mapping']['country_level0']['label'], \
            dim.label
        assert dim.model == self.source.model, dim.model

    def test_generate_db_entry_table(self):
        assert self.source.model.table.name == 'sci_study__entry', \
            self.source.model.table.name
        cols = self.source.model.table.c
        assert 'id' in cols
        assert isinstance(cols['id'].type, Unicode)

        assert 'time_id' in cols
        assert isinstance(cols['time_id'].type, Integer)
        assert 'amount' in cols
        assert isinstance(cols['amount'].type, Float)
        assert 'country_level0_id' in cols
        assert isinstance(cols['country_level0_id'].type, Integer)
        assert_raises(KeyError, cols.__getitem__, 'foo')

    # def test_facet_dimensions(self):
    #     assert [d.name for d in self.source.model.facet_dimensions] == ['to']


class TestDatasetLoad(DatabaseTestCase):

    def setUp(self):
        super(TestDatasetLoad, self).setUp()
        source = csvimport_fixture("sci_study")
        self.source = source 
        self.model = source.data
        # self.source = Dataset(model_fixture('simple'))
        # db.session.add(self.source)
        # db.session.commit()
        # self.source.model.generate()
        self.engine = db.engine

    # def test_load_all(self):
    #     resn = self.engine.execute(self.source.model.table.select()).fetchall()
    #     print "here's my len of ", len(resn)
    #     assert len(resn) == 6, resn
    #     row0 = resn[0]
    #     assert row0['amount'] == 200, row0.items()
    #     assert row0['country_level0'] == 'foo', row0.items()

    def test_drop(self):
        tn = self.engine.table_names()
        assert 'sci_study__entry' in tn, tn

        self.source.model.drop()
        tn = self.engine.table_names()
        assert 'sci_study__entry' not in tn, tn

    # def test_dataset_count(self):
    #     assert len(self.source.model) == 6, len(self.source.model)

    # def test_aggregate_simple(self):
    #     res = analytics.aggregate(self.source)
    #     assert res['summary']['num_entries'] == 6, res
    #     assert res['summary']['amount'] == 2690.0, res

    # def test_aggregate_basic_cut(self):
    #     res = analytics.aggregate(self.source, cuts=[('country_level0', u'Zimbabwe')])
    #     assert res['summary']['num_entries'] == 3, res
    #     assert res['summary']['amount'] == 1000, res

    # def test_aggregate_dimensions_drilldown(self):
    #     res = analytics.aggregate(self.source, drilldowns=['country_level0'])
    #     assert res['summary']['num_entries'] == 6, res
    #     assert res['summary']['amount'] == 2690, res
    #     assert len(res['drilldown']) == 2, res['drilldown']

    # def test_aggregate_two_dimensions_drilldown(self):
    #     res = analytics.aggregate(self.source, drilldowns=['country_level0'])
    #     assert res['summary']['num_entries'] == 6, res
    #     assert res['summary']['amount'] == 2690, res
    #     assert len(res['drilldown']) == 5, res['drilldown']

    # def test_aggregate_by_attribute(self):
    #     res = analytics.aggregate(self.source, drilldowns=['country_level0.label'])
    #     assert len(res['drilldown']) == 2, res['drilldown']

    # def test_aggregate_two_attributes_same_dimension(self):
    #     res = analytics.aggregate(self.source, drilldowns=['function.name',
    #                                                    'function.label'])
    #     assert len(res['drilldown']) == 2, res['drilldown']

    # def test_materialize_table(self):
    #     itr = self.source.model.entries()
    #     tbl = list(itr)
    #     assert len(tbl) == 6, len(tbl)
    #     row = tbl[0]
    #     assert isinstance(row['country_level0'], unicode), row
    #     assert isinstance(row['function'], dict), row
