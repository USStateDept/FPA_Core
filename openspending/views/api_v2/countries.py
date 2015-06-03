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
# from openspending.lib.indices import clear_index_cache
# from openspending.views.cache import etag_cache_keygen
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
@cache.cached(timeout=600)
def countries_list():
    output = Country.get_all_json()

    return json.dumps(output)
    #return jsonify(outputschema)



#POST and get country information
