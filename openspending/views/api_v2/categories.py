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
# from openspending.lib.indices import clear_index_cache
# from openspending.views.cache import etag_cache_keygen
# from openspending.views.context import api_form_data
from openspending.views.error import api_json_errors
# from openspending.validation.model.dataset import dataset_schema, source_schema
# from openspending.validation.model.mapping import mapping_schema
# from openspending.validation.model.common import ValidationState
# from openspending.tasks import check_column, load_source


log = logging.getLogger(__name__)
blueprint = Blueprint('categories_api2', __name__)



@blueprint.route('/categories')
@api_json_errors
@jsonp
def dataorgs():

    page_num = request.args.get('page', None)

    perpage = request.args.get('perpage', 25)

    includesubs = request.args.get('includesubs', True)

    limit = request.args.get('limit', None)

    if limit:
        query_all = query_all.limit(limit)

    query_all = Dataset.all(order=True)
    numpages = 1
    page = 1
    if page_num:
        total_indicators = query_all.count()
        query_all = query_all.offset(int(page_num) * int(perpage)).limit(int(perpage))
        numpages = int(float(total_indicators)/float(perpage)) + 1
        page = page_num

    outputschema = {
                        "page":page,
                        "numpages": numpages,
                        "data":
                            {
                                "categories":{
                                    "total":0,
                                    "data":collections.OrderedDict({})
                                },
                                "sources":{
                                    "total":0,
                                    "data":collections.OrderedDict({})
                                },
                                "indicators":{
                                    "total":0,
                                    "data":collections.OrderedDict({})
                                }
                            }
                    }


    for indicator in query_all.all():
        keyname = indicator.name
        dataorg = getattr(indicator, "dataorg", None)
        if not dataorg:
            dataorg = "None"
        else:

            if outputschema['data']['sources']['data'].get(dataorg.label, None):
                outputschema['data']['sources']['data'][dataorg.label]['indicators'].append(indicator.name)
            else:
                outputschema['data']['sources']['data'][dataorg.label] = {
                                                                    'label': dataorg.label,
                                                                    'indicators': [indicator.name]
                                                                }
                outputschema['data']['sources']['total'] += 1

            dataorg = dataorg.label
        tags = getattr(indicator, "tags", [])
        subcategory = "None"
        category = "None"

        for tag in tags:
            if tag.category == "categories":
                if outputschema['data']['categories']['data'].get(tag.slug_label, None):
                    outputschema['data']['categories']['data'][tag.slug_label]['indicators'].append(indicator.name)
                else:
                    outputschema['data']['categories']['data'][tag.slug_label] = {
                                                                        'label': tag.label,
                                                                        'indicators': [indicator.name],
                                                                        "subcategories": {}
                                                                    }
                    outputschema['data']['categories']['total'] += 1
                category = tag.label
            elif tag.category == "subcategories":
            #     if outputschema['data']['categories']['data'].get(tag.slug_label, None):
            #         if outputschema['data']['categories']['data'][tag.slug_label]['subcategories'].get(tag.slug_label, None):
            #             outputschema['data']['categories']['data'][tag.slug_label]['subcategories'][tag.slug_label]['indicators'].append(indicator.name)
            #         else:
            #             outputschema['data']['categories']['data'][tag.slug_label]['subcategories'][tag.slug_label] = {
            #                                                                                                             "label": tag.label,
            #                                                                                                             "indicators": [indicator.name]
            #                                                                                                             }
            #         ['indicators'].append(indicator.name)
            #     else:
            #         outputschema['data']['categories']['data'][tag.slug_label] = {
            #                                                             'label': tag.label,
            #                                                             'indicators': [indicator.name],
            #                                                             "subcategories": {}
            #                                                         }
            #         outputschema['data']['categories']['total'] += 1
                subcategory = tag.label


        indicatorschema = {
                            "label":getattr(indicator, "label", "No Label"),
                            "description":getattr(indicator, "description", "No Description"),
                            "source":dataorg,
                            "category":category,
                            "subcategory":subcategory
                        }
        outputschema['data']['indicators']['data'][keyname] = indicatorschema
        outputschema['data']['indicators']['total'] += 1

    #outputschema['data']['indicators'] = list(sorted(outputschema['data']['indicators'].items(), key=lambda x: x))






    return jsonify(outputschema)

