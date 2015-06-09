import re
import csv
import json
import datetime

from flask import url_for, current_app

from openspending.core import db
from openspending.tests.base import ControllerTestCase


class TestCubesController(ControllerTestCase):

    def setUp(self):
        super(TestCubesController, self).setUp()
        current_app.config['LOCKDOWN_FORCE'] = False
        current_app.config['PRESERVE_CONTEXT_ON_EXCEPTION'] = False


    def test_cubes(self):
        response = self.client.get('/api/slicer/cubes')
        assert '200' in response.status
        theobj = json.loads(response.data)
        assert len(theobj) == 2

    def test_cubes_model(self):
        response = self.client.get('/api/slicer/cube/geometry/cubes_model?cubes=data_good2')
        assert '200' in response.status
        assert 'region_wb' in response.data



    def test_global_call(self):
        response = self.client.get('/api/slicer/cube/geometry/cubes_aggregate?cubes=data_good2')
        assert '200' in response.status
        theobj = json.loads(response.data)
        print theobj['summary']
        assert theobj['summary']['num_entries'] == 8337
        assert 'data_good2__amount_avg' in response.data

    def test_drilldown(self):
        response = self.client.get('/api/slicer/cube/geometry/cubes_aggregate?cubes=data_good2&drilldown=geometry__country_level0@name')
        assert '200' in response.status
        theobj = json.loads(response.data)
        for subobj in theobj['cells']:
            if subobj['geometry__country_level0.name'] == "switzerland":
                assert subobj['num_entries'] == 41
        assert len(theobj['cells']) == 249

    def test_drilldown_time(self):
        response = self.client.get('/api/slicer/cube/geometry/cubes_aggregate?cubes=data_good2&drilldown=geometry__country_level0@name|geometry__time')
        assert '200' in response.status
        theobj = json.loads(response.data)
        for subobj in theobj['cells']:
            if subobj['geometry__country_level0.name'] == "afghanistan" and subobj['geometry__time'] == 2009:
                assert subobj['data_good2__amount_avg'] == 4.3
                assert subobj['num_entries'] == 2
        assert len(theobj['cells']) == 6474


    def test_drilldown_cuts(self):
        response = self.client.get('/api/slicer/cube/geometry/cubes_aggregate?cubes=data_good2&drilldown=geometry__country_level0@name|geometry__time&cut=geometry__time:1999')
        assert '200' in response.status
        theobj = json.loads(response.data)
        assert len(theobj['cells']) == 249


    def test_drilldown_cuts_region(self):
        response = self.client.get('/api/slicer/cube/geometry/cubes_aggregate?cubes=data_good2&drilldown=geometry__country_level0@dos_region&cut=geometry__time:2005')
        assert '200' in response.status
        theobj = json.loads(response.data)
        for subobj in theobj['cells']:
            if subobj['geometry__country_level0.dos_region'] == "NEA":
                assert subobj['data_good2__amount_avg'] == 3.368
                assert subobj['num_entries'] == 30
        assert len(theobj['cells']) == 7

    def test_drilldown_cuts_range(self):
        response = self.client.get('/api/slicer/cube/geometry/cubes_aggregate?cubes=data_good2&drilldown=geometry__country_level0@dos_region&cut=geometry__time:2005-')
        assert '200' in response.status
        theobj = json.loads(response.data)
        for subobj in theobj['cells']:
            if subobj['geometry__country_level0.dos_region'] == "NEA":
                assert subobj['data_good2__amount_avg'] == 3.425
                assert subobj['num_entries'] == 1015
        assert len(theobj['cells']) == 7

    def test_drilldown_multiple(self):
        response = self.client.get('/api/slicer/cube/geometry/cubes_aggregate?cubes=data_good2|datatest_good&drilldown=geometry__country_level0@sovereignt')
        assert '200' in response.status
        theobj = json.loads(response.data)
        for subobj in theobj['cells']:
            if subobj['geometry__country_level0.sovereignt'] == "Costa Rica":
                assert subobj['data_good2__amount_sum'] == 186.55
                assert subobj['num_entries'] == 41
                assert subobj['datatest_good__amount_avg'] == 19454901244.1706
        assert len(theobj['cells']) == 199

