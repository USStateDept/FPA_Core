import logging
import sys
import traceback
from slugify import slugify
import json
import collections

from flask import Blueprint, request, Response
#from flask.ext.login import current_user

#from openspending.core import db, sourcefiles
from openspending.model import Dataset
from openspending.lib.findui import jsonp
#, Source, Run, DataOrg, SourceFile
# from openspending.auth import requir
import json
from openspending.core import cache
# from openspending.lib.indices import clear_index_cache
# from openspending.views.context import api_form_data
from openspending.views.error import api_json_errors
# from openspending.validation.model.dataset import dataset_schema, source_schema
# from openspending.validation.model.mapping import mapping_schema
# from openspending.validation.model.common import ValidationState
# from openspending.tasks import check_column, load_source


log = logging.getLogger(__name__)
blueprint = Blueprint('categories_api2', __name__)


def make_name(*args):
    return "categories_list67677667"

@blueprint.route('/categories')
#@api_json_errors
@cache.memoize(timeout=30, make_name=make_name)
#@jsonp
def categories_list():

    page_num = request.args.get('page', None)

    perpage = request.args.get('perpage', 25)

    includesubs = request.args.get('includesubs', True)

    limit = request.args.get('limit', None)

    query_all = Dataset.all(order=True)

    if limit:
        query_all = query_all.limit(int(limit))

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
                                "subcategories":{
                                    #"total":0,
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
        if not getattr(indicator, "mapping", None):
            continue
        keyname = indicator.name
        years = getattr(indicator,"years",None)
        if years:
            the_years=[]
            the_years=years.split(",")
            the_years=map(int,the_years)
            the_years.sort()
        else:
            the_years= []
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
            if tag.category == "spsd":
                if outputschema['data']['categories']['data'].get(tag.slug_label, None):
                    outputschema['data']['categories']['data'][tag.slug_label]['indicators'].append(indicator.name)
                else:
                    outputschema['data']['categories']['data'][tag.slug_label] = {
                                                                        'label': tag.label,
                                                                        'indicators': [indicator.name]
                                                                        #"subcategories": {}
                                                                    }
                    outputschema['data']['categories']['total'] += 1
                category = tag.slug_label
            elif tag.category == "subspsd":
                #if outputschema['data']['categories']['data'].get(tag.slug_label, None):
                outputschema['data']['subcategories']['data'][tag.slug_label]= {'label':tag.label}
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
                subcategory = tag.slug_label


        indicatorschema = {
                            "label":getattr(indicator, "label", "No Label"),
                            "description":getattr(indicator, "description", "No Description"),
                            "source":dataorg,
                            "category":category,
                            "subcategory":subcategory,
                            "years":the_years
                        }
        outputschema['data']['indicators']['data'][keyname] = indicatorschema
        outputschema['data']['indicators']['total'] += 1

    #outputschema['data']['indicators'] = list(sorted(outputschema['data']['indicators'].items(), key=lambda x: x))
    # resp = Response(response=json.dumps({'data':outputschema}),
    #         status=200, \
    #         mimetype="application/json")
    # return resp
    return json.dumps(outputschema)


