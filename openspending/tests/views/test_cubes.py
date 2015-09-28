import re
import csv
import json
import datetime

from flask import url_for, current_app
import requests

from openspending.core import db
from openspending.tests.base import ControllerTestCase

APIPREFIX = "http://localhost:3000"

class TestCubesController(ControllerTestCase):

    def setUp(self):
        super(TestCubesController, self).setUp()
        current_app.config['LOCKDOWN_FORCE'] = False
        current_app.config['PRESERVE_CONTEXT_ON_EXCEPTION'] = False



    # def test_cubes_model(self):
    #     response = self.client.get('/api/3/slicer/model?cubes=data_good2')
    #     assert 200 ==  response.status_code
    #     assert 'region_wb' in response.text



    def test_global_call(self):
        response = requests.get('%s/api/5/slicer/aggregate?cubes=foreign_direct_investment_net'%APIPREFIX)
        assert 200 ==  response.status_code
        theobj = json.loads(response.text)
        assert 'foreign_direct_investment_net__avg' in response.text

    def test_drilldown(self):
        response = requests.get('%s/api/5/slicer/aggregate?cubes=energy_imports_net&drilldown=geometry__country_level0@name'%APIPREFIX)
        assert 200 ==  response.status_code
        theobj = json.loads(response.text)
        for subobj in theobj['cells']:
            if subobj['geo__name'] == "switzerland":
                assert subobj['count'] == "23"

    def test_drilldown_time(self):
        response = requests.get('%s/api/5/slicer/aggregate?cubes=control_of_corruption_mcp_scal&drilldown=geometry__country_level0@name|geometry__time'%APIPREFIX)
        assert 200 ==  response.status_code
        theobj = json.loads(response.text)
        for subobj in theobj['cells']:
            if subobj['geo__name'] == "afghanistan" and subobj['time'] == 2009:
                assert subobj['control_of_corruption_mcp_scal__avg'] == 1
                assert subobj['count'] == "1"


    def test_drilldown_cuts(self):
        response = requests.get('%s/api/5/slicer/aggregate?cubes=government_effectiveness&drilldown=geometry__country_level0@name|geometry__time&daterange=2014-2014'%APIPREFIX)
        assert 200 ==  response.status_code
        theobj = json.loads(response.text)


    def test_drilldown_cuts_region(self):
        response = requests.get('%s/api/5/slicer/aggregate?cubes=gross_school_enrollment_second&drilldown=geometry__country_level0@dos_region&daterange=2005-2005'%APIPREFIX)
        assert 200 ==  response.status_code
        theobj = json.loads(response.text)
        for subobj in theobj['cells']:
            if subobj['geo__dos_region'] == "NEA":
                assert subobj['gross_school_enrollment_second__min'] == 2.2
                assert subobj['count'] == "17"
        assert len(theobj['cells']) == 7

    def test_drilldown_cuts_range(self):
        response = requests.get('%s/api/5/slicer/aggregate?cubes=gross_school_enrollment_second&drilldown=geometry__country_level0@dos_region&daterange=2005-2015'%APIPREFIX)
        assert 200 ==  response.status_code
        theobj = json.loads(response.text)
        for subobj in theobj['cells']:
            if subobj['geo__dos_region'] == "NEA":
                assert subobj['gross_school_enrollment_second__min'] == 2.1
                assert subobj['count'] == "156"
        assert len(theobj['cells']) == 7

    def test_drilldown_multiple(self):
        response = requests.get('%s/api/5/slicer/aggregate?cubes=access_to_electricity|carbon_stock_in_living_forest&drilldown=geometry__country_level0@sovereignt'%APIPREFIX)
        assert 200 ==  response.status_code
        theobj = json.loads(response.text)
        for subobj in theobj['cells']:
            if subobj['geo__sovereignt'] == "Costa Rica":
                assert subobj['access_to_electricity__avg'] == 95.6905033333333
                assert subobj['count'] == "3"
                assert subobj['carbon_stock_in_living_forest__avg'] == 229.333333333333

