import json
import urllib2

from flask import url_for, current_app

from openspending.core import db
from openspending.model.country import Country
from openspending.tests.base import ControllerTestCase

from openspending.command.geometry import create as createcountries





class TestCountryModel(ControllerTestCase):
    def setUp(self):
        super(TestCountryModel, self).setUp()
        createcountries()


    def tearDown(self):
        pass

    def test_all_countries(self):
        result = Country.get_all_json()
        assert len(result['data']) == 249
        assert len(result['data'][0]['regions']) == 8

    def test_properties_regions(self):
        tempobj = Country.by_gid(1)
        assert len(tempobj.regions.keys()) == 10
        assert tempobj.label == "Aruba"

    def test_properties_regions(self):
        tempobj = Country.by_gid(1)
        assert tempobj.sovereignty == "Netherlands"


