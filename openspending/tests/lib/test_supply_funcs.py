import json
import urllib2

from flask import url_for, current_app
import requests

from openspending.core import db
from openspending.model.country import Country
from openspending.tests.base import ControllerTestCase

from openspending.command.geometry import create as createcountries





class TestSupportFuncs(ControllerTestCase):
    def setUp(self):
        super(TestSupportFuncs, self).setUp()


    def tearDown(self):
        pass

    def test_json_parse_ascii(self):
    	from openspending.preprocessors.processing_funcs import json_to_csv
    	#human develoment index showed ascii error
    	resp = requests.get("https://data.undp.org/resource/y8j2-3vi9.json")
    	returner = json_to_csv(resp.text)
    	assert returner != None


        
