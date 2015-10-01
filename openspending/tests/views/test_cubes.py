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

    # def test_cubes_model(self):
    #     response = self.client.get('/api/3/slicer/model?cubes=data_good2')
    #     assert '200' in response.status
    #     assert 'region_wb' in response.data



    def test_global_call(self):
        response = self.client.get('/api/3/slicer/aggregate?cubes=data_good2')
        assert '200' in response.status
        theobj = json.loads(response.data)
        assert 'data_good2__avg' in response.data

    def test_drilldown(self):
        response = self.client.get('/api/3/slicer/aggregate?cubes=data_good2&drilldown=geometry__country_level0@name')
        assert '200' in response.status
        theobj = json.loads(response.data)
        for subobj in theobj['cells']:
            if subobj['geo__name'] == "switzerland":
                assert subobj['count'] == 41

    def test_drilldown_time(self):
        response = self.client.get('/api/3/slicer/aggregate?cubes=data_good2&drilldown=geometry__country_level0@name|geometry__time')
        assert '200' in response.status
        theobj = json.loads(response.data)
        for subobj in theobj['cells']:
            if subobj['geo__name'] == "afghanistan" and subobj['time'] == 2009:
                assert subobj['data_good2__avg'] == 4.3
                assert subobj['count'] == 2


    def test_drilldown_cuts(self):
        response = self.client.get('/api/3/slicer/aggregate?cubes=data_good2&drilldown=geometry__country_level0@name|geometry__time&daterange=2014-2014')
        assert '200' in response.status
        theobj = json.loads(response.data)


    def test_drilldown_cuts_region(self):
        response = self.client.get('/api/3/slicer/aggregate?cubes=data_good2&drilldown=geometry__country_level0@dos_region&daterange=2005-2005')
        assert '200' in response.status
        theobj = json.loads(response.data)
        for subobj in theobj['cells']:
            if subobj['geo__dos_region'] == "NEA":
                assert subobj['data_good2__avg'] == 3.368
                assert subobj['count'] == 20
        assert len(theobj['cells']) == 7

    def test_drilldown_cuts_range(self):
        response = self.client.get('/api/3/slicer/aggregate?cubes=data_good2&drilldown=geometry__country_level0@dos_region&daterange=2005-2015')
        assert '200' in response.status
        theobj = json.loads(response.data)
        for subobj in theobj['cells']:
            if subobj['geo__dos_region'] == "NEA":
                assert subobj['data_good2__avg'] == 3.425
                assert subobj['count'] == 230
        assert len(theobj['cells']) == 7

    def test_drilldown_multiple(self):
        response = self.client.get('/api/3/slicer/aggregate?cubes=data_good2|datatest_good&drilldown=geometry__country_level0@sovereignt')
        assert '200' in response.status
        theobj = json.loads(response.data)
        for subobj in theobj['cells']:
            if subobj['geo__sovereignt'] == "Costa Rica":
                assert subobj['data_good2__sum'] == 175.58
                assert subobj['count'] == 28
                assert subobj['datatest_good__avg'] == 21924136720.0383

