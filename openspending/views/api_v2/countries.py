import logging
import sys
import traceback
from slugify import slugify
import json
import collections

from flask import Blueprint, request
#from flask.ext.login import current_user

#from openspending.core import db, sourcefiles
from openspending.model import Dataset
from openspending.lib.findui import jsonp
#, Source, Run, DataOrg, SourceFile
# from openspending.auth import require
from openspending.lib.jsonexport import jsonify
import json
from openspending.core import cache
# from openspending.views.context import api_form_data
from openspending.views.error import api_json_errors
# from openspending.validation.model.dataset import dataset_schema, source_schema
# from openspending.validation.model.mapping import mapping_schema
# from openspending.validation.model.common import ValidationState
# from openspending.tasks import check_column, load_source
from openspending.model.country import Country


log = logging.getLogger(__name__)
blueprint = Blueprint('countries_api2', __name__)




@blueprint.route('/countries_list')
@api_json_errors
@jsonp
@cache.cached(timeout=30)
def countries_list():

    country_data = {"data":{
                        "countries":{},
                        "regions":[]
                    }}

    country_data['data']['countries'] = Country.get_all_json()

    countrygroupingset = [
        {
            "id": "all",
            "label": "All Countries",
            "geounit": "all:all",
            "selected": False,
            "filtered": False,
            "regions": {}
        }, 
        {
            "id": "continent",
            "label": "Continent",
            "geounit": "continent:all",
            "selected": False,
            "filtered": False,
            "regions": {}
        }, 
        {
            "id": "dod_cmd",
            "label": "Department of Defense",
            "geounit": "dod_cmd:all",
            "selected": False,
            "filtered": False,
            "regions": {}
        }, 
        {
            "id": "dos_region",
            "label": "Department of State",
            "geounit": "dos_region:all",
            "selected": False,
            "filtered": False,
            "regions": {}
        }, 
        {
            "id": "usaid_reg",
            "label": "USAID",
            "geounit": "usaid_reg:all",
            "selected": False,
            "filtered": False,
            "regions": {}
        }, 
        {
            "id": "wb_inc_lvl",
            "label": "Income Groups",
            "geounit": "wb_inc_lvl:all",
            "selected": False,
            "filtered": False,
            "regions": {}
        }]


    for countrygroupobj in countrygroupingset:
        if countrygroupobj['id'] == "all":
            countrygroupobj['regions']= {"countries": {
                                        "id": 'countries',
                                        "label": 'countries',
                                        "geounit": countrygroupobj['id'] + ":" + 'countries',
                                        "selected": False,
                                        "filtered": False,
                                        'countries': [conobj for conobj in country_data['data']['countries']]
                                        }}
            continue
        for countryobj in country_data['data']['countries']:
            regionid = countryobj['regions'].get(countrygroupobj['id'], None)
            if regionid:
                if countrygroupobj['regions'].get(regionid):
                    countrygroupobj['regions'][regionid]['countries'].append(countryobj)
                else:
                    countrygroupobj['regions'][regionid] = \
                                    {
                                        "id": regionid,
                                        "label": regionid,
                                        "geounit": countrygroupobj['id'] + ":" + regionid,
                                        "countries": [countryobj],
                                        "selected": False,
                                        "filtered": False
                                    }


    country_data['data']['regions'] = countrygroupingset
        
    return json.dumps(country_data)



#POST and get country information
