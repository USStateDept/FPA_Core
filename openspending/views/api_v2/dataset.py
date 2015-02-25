import logging

from flask import Blueprint, request
from flask.ext.login import current_user
from flask.ext.babel import gettext as _
from colander import SchemaNode, String, Invalid
from restpager import Pager

from openspending.core import db
from openspending.model import Dataset, Source, Run
from openspending.auth import require
from openspending.lib import solr_util as solr
from openspending.lib.jsonexport import jsonify
from openspending.lib.helpers import get_dataset, get_source
from openspending.lib.indices import clear_index_cache
from openspending.views.cache import etag_cache_keygen
from openspending.views.context import api_form_data
from openspending.views.error import api_json_errors
from openspending.validation.model.dataset import dataset_schema, source_schema
from openspending.validation.model.mapping import mapping_schema
from openspending.validation.model.common import ValidationState
from openspending.tasks import check_column, load_source


log = logging.getLogger(__name__)
blueprint = Blueprint('datasets_api2', __name__)


@blueprint.route('/datasets')
@api_json_errors
def index():
    #page = request.args.get('page')
    fields = request.args.get('fields', "").split(",")
    getsources = request.args.get('getsources', None)

    q = Dataset.all_by_account(current_user).all()

    if len(fields) < 1 and not getsources:
        return jsonify(q)
    
    returnset = []
    for obj in q:
        tempobj = {} 
        if len(fields) >0:
            for field in fields:
                tempobj[field] = getattr(obj, field)
        else:
            tempobj = obj.as_dict()
        if getsources:
            tempobj['sources'] = obj.sources.all()
        returnset.append(tempobj) 


    # TODO: Facets for territories and languages
    # TODO: filters on facet dimensions
    #maybe put the pager back in
    # print q
    # pager = Pager(q)
    return jsonify(returnset)


@blueprint.route('/datasets/<name>')
@api_json_errors
def view(name):
    """
    Get the dataset info to populate a form
    """

    dataset = get_dataset(name)
    etag_cache_keygen(dataset)
    return jsonify(dataset)


@blueprint.route('/datasets', methods=['POST', 'PUT'])
@api_json_errors
def create():
    """
    This takes a json format post with label, name, description
    and creates a private dataset to put sources in
    The json_errors return a json object
    """

    if not require.dataset.create():
        return jsonify({"errors":["Can not create new dataset.  Permission denied"]})

    try:
        dataset = api_form_data()
        model = {'dataset': dataset}
        schema = dataset_schema(ValidationState(model))
        data = schema.deserialize(dataset)
        if Dataset.by_name(data['name']) is not None:
            return jsonify({"errors":["A dataset with this name already exists"]})
        dataset = Dataset({'dataset': data})
        dataset.private = True
        dataset.managers.append(current_user)
        db.session.add(dataset)
        db.session.commit()
        return jsonify({"success":True, "dataset":dataset.name})
    except Exception, e:
        return jsonify({"errors":['Unknown Error has occurred']})



@blueprint.route('/datasets/<name>', methods=['POST', 'PUT'])
@api_json_errors
def update(name):
    """
    Update a dataset with a json object and name from the dataset form
    """
    try:
        dataset = get_dataset(name)
        require.dataset.update(dataset)
        schema = dataset_schema(ValidationState(dataset.model_data))
        data = schema.deserialize(api_form_data())
        dataset.update(data)
        db.session.commit()
        #clear_index_cache()
        return jsonify({"Success":True})
    except Exception, e:
        print e
        return jsonify({"errors":['Unknown Error has occurred']}) 


@blueprint.route('/datasets/<datasetname>/model/<sourcename>/fields')
@api_json_errors
def field(datasetname, sourcename):
    """
    get the column names and any existing info for them
    - add check for if source name does not exist
    """
    mysource = Source.by_source_name(sourcename)
    source = get_source(sourcename)

    if source.data:
        #we have a model.  Get the model info
        modeler = source.data['mapping']
        refineproj = source.get_or_create_ORProject()
        columns = refineproj.refineproj.columns
        return jsonify({"columns":columns, "modeler":modeler}, headers= {'Cache-Control' : 'no-cache'})
    else:
        refineproj = source.get_or_create_ORProject()
        headers= {'Cache-Control' : 'no-cache'}
        basemodeler = {"country_level0": {"column":None, "label":None, "description":None},
                      "time": {"column":None, "label":None, "description":None},
                      "indicatorvalue": {"column":None, "label":None, "description":None}
                      }
        # this is awkward.  the class should be extended
        return jsonify({"columns": refineproj.refineproj.columns, 'modeler':basemodeler}, headers=headers)


@blueprint.route('/datasets/<datasetname>/model/<sourcename>/fieldcheck/<columnname>', methods=['GET'])
@api_json_errors
def field_polling_check(datasetname, sourcename, columnname):
    """
    GET to check if the run is complete
    """

    source = get_source(sourcename)
    if self.data:
        #we have a model.  Get the model info
        return jsonify({"error":"not yet implemented"})
    else:
        refineproj = source.get_or_create_ORProject()
        # this is awkward.  the class should be extended
        return jsonify(refineproj.refineproj.columns)



@blueprint.route('/datasets/<datasetname>/model/<sourcename>/fieldcheck/<columnkey>', methods=['POST'])
@api_json_errors
def field_polling_post(datasetname, sourcename, columnkey):
    """
    post to check to verify that the column is good
    """

    #print request.get_json().get('columnval', None)
    ORcolumn = request.get_json().get('columnval', None)
    if not ORcolumn:
        return jsonify({"errors":["could not find the column name"]})

    dataset = get_dataset(datasetname)

    if not require.dataset.update(dataset):
        return jsonify({"errors":["Can not create new dataset.  Permission denied"]})

    try:
        columnsettings = api_form_data()

        source = get_source(sourcename)

        #use this later if async run is necessary
        #runop = Run(columnsettings['columnval'], dataset, source)
        #db.session.add(runop)
        #db.session.commit()

        #check_column.apply_async(args=[source.id, columnkey, columnsettings['columnval'], runop.id], countdown=1)
        resultval = check_column(source.id, columnkey, columnsettings['columnval'])

        if len(resultval['errors']) == 0:
            return jsonify({"Success":True})
        else:
            return jsonify(resultval)
    except Exception, e:
        return jsonify({"errors":['Unknown Error has occurred']})



@blueprint.route('/datasets/<datasetname>/model', defaults={'sourcename': None})
@blueprint.route('/datasets/<datasetname>/model/create__source', defaults={'sourcename': "create__source"})
@blueprint.route('/datasets/<datasetname>/model/<sourcename>')
@api_json_errors
def model(datasetname, sourcename):
    #if not sourcename then we are saving the defaults for dataset
    if sourcename == "create__source":
        #this will have the name and URL
        #verify that name is unique

        dataset = get_dataset(datasetname)
        if not require.dataset.create(dataset):
            return jsonify({"errors":["Can not create new source.  Permission denied"]})
        #create new source
        return jsonify(require.dataset.read(dataset))
    elif not sourcename:
        dataset = get_dataset(datasetname)
        etag_cache_keygen(dataset)
        return jsonify(dataset.mapping) 
    else:
        source = get_source(sourcename)
        return jsonify(source)



@blueprint.route('/datasets/<datasetname>/model/create_default', defaults={'sourcename': "create__default"})
def update_model_createdefault(datasetname, sourcename):
    dataset = get_dataset(datasetname)
    if not require.dataset.update(dataset):
        return jsonify({"errors":["Can not create new source.  Permission denied"]})

    #source will have name and URL
    source = api_form_data()

    #verify that name is unique

    model = {'source': source}
    schema = source_schema(ValidationState(model))

    data = schema.deserialize(source)
    if Source.by_source_name(data['name']) is not None:
        return jsonify({"errors":["A dataset with this name already exists"]})
    #source = Source({'souce': data})
    # dataset.private = True
    # dataset.managers.append(current_user)
    # db.session.add(dataset)
    # db.session.commit()

    #create new source
    return jsonify(require.dataset.read(dataset))

@blueprint.route('/datasets/<datasetname>/model', methods=['POST', 'PUT'], defaults={'sourcename': None})
def update_model_createnew(datasetname, sourcename):
    dataset = get_dataset(datasetname)
    if not require.dataset.update(dataset):
        return jsonify({"errors":["Can not create new source.  Permission denied"]})
    #source will have name and URL
    source = api_form_data()

    #verify that name is unique and URL is real
    model = {'source': source}
    schema = source_schema(ValidationState(model))
    try:
        data = schema.deserialize(source)
    except Invalid, e:
        #print message in thefuture
        return jsonify({"errors":["Invalid field"]})
    if Source.by_source_name(data['name']) is not None:
        return jsonify({"errors":["A dataset with this name already exists"]})

    #addin the dataset
    data['dataset'] = dataset
    source = Source(dataset=dataset, name=data['name'], url=data['url'], creator=current_user)
    #dataset.private = True
    #dataset.managers.append(current_user)
    db.session.add(source)
    db.session.commit()

    return jsonify(source)




@blueprint.route('/datasets/<datasetname>/model/<sourcename>', methods=['POST', 'PUT'])
@api_json_errors
def update_model(datasetname, sourcename):

    #we just got everything now let's save it
    sourcemeta = request.get_json().get("meta", None)
    sourcemodeler = request.get_json().get("modeler", None)
    #validate that we have everything here

    r = {"mapping":{}}

    r['mapping']["country_level0"] = {  
             "attributes":{  
                "name":{  
                   "column":sourcemodeler['country_level0']['column'],
                   "datatype":"id",
                   "default_value":""
                },
                "label":{  
                   "column":sourcemodeler['country_level0']['column'],
                   "datatype":"string",
                   "default_value":""
                }
             },
             "type":"compound",
             "description":sourcemodeler['country_level0']['description'],
             "label":sourcemodeler['country_level0']['label']
          }

    r['mapping']['amount'] = {  
         "default_value":"",
         "datatype":"float",
         "description":sourcemodeler['indicatorvalue']['description'],
         "column":sourcemodeler['indicatorvalue']['column'],
         "type":"measure",
         "label":sourcemodeler['indicatorvalue']['label']
      }

    r['mapping']["time"] = {  
         "default_value":"",
         "description":sourcemodeler['time']['description'],
         "format":None,
         "column":sourcemodeler['time']['column'],
         "label":sourcemodeler['time']['label'],
         "datatype":"date",
         "type":"date"
      }

    r['mapping']["time"] = {  
         "default_value":"",
         "description":sourcemodeler['time']['description'],
         "format":None,
         "column":sourcemodeler['time']['column'],
         "label":sourcemodeler['time']['label'],
         "datatype":"date",
         "type":"date"
      }

    #this unique number is appended to each item
    r['mapping']["theid"] = {"default_value": "", "datatype": "string", "description": "Unique ID", "key": True, "column": "uniqueid", "type": "attribute", "label": "UniqueID"}
    #add extra columns

    source = get_source(sourcename)
    source.addData(r)
    db.session.commit()


    load_source(source.id)
    #add async request to load data

    return jsonify({"Success":True})

    #using colinder
    # require.dataset.update(dataset)
    # model_data = dataset.model_data
    # model_data['mapping'] = api_form_data()
    # schema = mapping_schema(ValidationState(model_data))
    # new_mapping = schema.deserialize(model_data['mapping'])
    # dataset.data['mapping'] = new_mapping
    # db.session.commit()
    # return model(name)


@blueprint.route('/datasets/<datasetname>/sources/<sourcename>', methods=['DELETE'])
@api_json_errors
def delete(datasetname, sourcename):
    try:
        dataset = get_dataset(datasetname)
        require.dataset.update(dataset)

        source = get_source(sourcename)
        db.session.delete(source)
        db.session.commit()
        clear_index_cache()

        q = Dataset.all_by_account(current_user).all()
        
        returnset = []
        for obj in q:
            tempobj = obj.as_dict()
            tempobj['sources'] = obj.sources.all()
            returnset.append(tempobj) 

        #drop solr index
        #solr.drop_index(source.name)
        return jsonify(returnset)
    except Exception, e:
        return jsonify({"errors":[e]})
    # require.dataset.update(dataset)


@blueprint.route('/datasets/<datasetname>/model/<sourcename>/ORoperations')
@api_json_errors
def ORoperations(datasetname, sourcename):
    try:
        source = get_source(sourcename)
        ORinstructions = source.getORInstructions()
        return jsonify(ORinstructions)
    except Exception, e:
        return jsonify({"error":"Could not fetch the ORinstructions"})
