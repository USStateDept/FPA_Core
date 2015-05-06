import logging
import sys
import traceback
from slugify import slugify
import json

from flask import Blueprint, request
from flask.ext.login import current_user
from colander import SchemaNode, String, Invalid
from restpager import Pager

from openspending.core import db, sourcefiles
from openspending.model import Dataset, Source, Run, DataOrg, SourceFile
from openspending.auth import require
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



@blueprint.route('/dataorgs')
@api_json_errors
def dataorgs():
    #page = request.args.get('page')

    q = DataOrg.get_all_admin().all()

    return jsonify(q, headers= {'Cache-Control' : 'no-cache'})



@blueprint.route('/datasets')
@api_json_errors
def index():
    #page = request.args.get('page')

    q = Dataset.get_all_admin().all()

    returnset = []
    for theobj in q:
        returnset.append(theobj)

    # if len(fields) < 1 and not getsources:
    #     return jsonify(q)
    
    # returnset = []
    # for obj in q:
    #     tempobj = {} 
    #     if len(fields) >0:
    #         for field in fields:
    #             tempobj[field] = getattr(obj, field)
    #     else:
    #         tempobj = obj.as_dict()
    #     if getsources:
    #         tempobj['sources'] = obj.sources.all()
    #     returnset.append(tempobj) 


    # TODO: Facets for territories and languages
    # TODO: filters on facet dimensions
    #maybe put the pager back in
    # print q
    # pager = Pager(q)
    return jsonify(returnset, headers= {'Cache-Control' : 'no-cache'})


@blueprint.route('/datasets/<name>')
@api_json_errors
def view(name):
    """
    Get the dataset info to populate a form
    """

    dataset = get_dataset(name)
    etag_cache_keygen(dataset)
    return jsonify(dataset, headers= {'Cache-Control' : 'no-cache'})


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
        if not dataset.get("dataorg", None):
            return jsonify({"errors":["You must select the data source organization"]}) 
        model = {'data': dataset}
        schema = dataset_schema(ValidationState(model))
        data = schema.deserialize(dataset)

        #should have a better place for sluggify
        if (data.get('name', None)):
            tempname = slugify(str(data.get('name')), max_length=50)
        else:
            tempname = slugify(str(data.get('label')), max_length=50)

        if Dataset.by_name(tempname) is not None:
            return jsonify({"errors":["A dataset with this name already exists "]})

        dataset = Dataset(data=data)
        dataset.managers.append(current_user)
        db.session.add(dataset)
        db.session.commit()
        return jsonify({"success":True, "dataset":dataset.name})
    except Exception, e:
        ex_type, ex, tb = sys.exc_info()
        print traceback.print_tb(tb)
        return jsonify({"errors":['Unknown Error has occurred: ' + str(e)]})



@blueprint.route('/datasets/<name>', methods=['POST', 'PUT'])
@api_json_errors
def update(name):
    """
    Update a dataset with a json object and name from the dataset form
    """
    try:
        dataset = get_dataset(name)
        require.dataset.update(dataset)
        schema = dataset_schema(ValidationState(dataset))
        data = schema.deserialize(api_form_data())
        print data
        dataset.update(data)
        db.session.commit()
        #clear_index_cache()
        return jsonify({"success":True})
    except Exception, e:
        print e
        return jsonify({"errors":['Unknown Error has occurred']}) 


@blueprint.route('/datasets/<datasetname>/model/fields')
@api_json_errors
def field(datasetname):
    """
    get the column names and any existing info for them
    - add check for if source name does not exist
    """
    dataset = get_dataset(datasetname)

    if dataset.mapping:
        #we have a model.  Get the model info
        modeler = dataset.mapping['mapping']
        refineproj = dataset.source.get_or_create_ORProject()
        columns = refineproj.refineproj.columns
        return jsonify({"columns":columns, "modeler":modeler}, headers= {'Cache-Control' : 'no-cache'})
    else:
        refineproj = dataset.source.get_or_create_ORProject()
        headers= {'Cache-Control' : 'no-cache'}

        basemodeler = DEFAULT_SOURCE_MAPPING

        return jsonify({"columns": refineproj.refineproj.columns, 'modeler':basemodeler}, headers=headers)


@blueprint.route('/datasets/<datasetname>/model/fieldcheck/<columnname>', methods=['GET'])
@api_json_errors
def field_polling_check(datasetname, columnname):
    """
    GET to check if the run is complete
    """
    dataset = get_dataset(datasetname)

    if dataset.data:
        #we have a model.  Get the model info
        return jsonify({"error":"not yet implemented"})
    else:
        refineproj = dataset.source.get_or_create_ORProject()
        # this is awkward.  the class should be extended
        return jsonify(refineproj.refineproj.columns)



@blueprint.route('/datasets/<datasetname>/model/fieldcheck/<columnkey>', methods=['POST'])
@api_json_errors
def field_polling_post(datasetname, columnkey):
    """
    post to check to verify that the column is good
    """

    #print request.get_json().get('columnval', None)
    ORcolumn = request.get_json().get('columnval', None)
    if not ORcolumn:
        return jsonify({"errors":["could not find the column name"]})

    dataset = get_dataset(datasetname)

    if not require.dataset.update(dataset):
        return jsonify({"errors":["Permission denied"]})

    try:
        columnsettings = api_form_data()

        #use this later if async run is necessary
        #runop = Run(columnsettings['columnval'], dataset, source)
        #db.session.add(runop)
        #db.session.commit()

        #check_column.apply_async(args=[source.id, columnkey, columnsettings['columnval'], runop.id], countdown=1)
        resultval = check_column(dataset.source.id, columnkey, columnsettings['columnval'])

        if len(resultval['errors']) == 0:
            return jsonify({"success":True})
        else:
            return jsonify(resultval)
    except Exception, e:
        print "here is my error", e
        return jsonify({"errors":['Unknown Error has occurred']})






#probably shouldn't be a GET
@blueprint.route('/datasets/<datasetname>/applymodel')
@api_json_errors
def apply_default_model(datasetname):

    dataset = get_dataset(datasetname)

    if not dataset.dataorg or not dataset:
        return jsonify({"errors":["Invalid URL.  Could not find dataorg"]})

    dataorg = dataset.dataorg

    if not dataorg.ORTemplate or not dataorg.mappingTemplate:
        return jsonify({"errors":["Dataorg has no template"]})

    dataset.source.applyORInstructions(dataorg.ORTemplate)


    dataset.mapping = dataorg.mappingTemplate


    db.session.commit()



    return jsonify(dataset.source, headers= {'Cache-Control' : 'no-cache'})


@blueprint.route('/datasets/<datasetname>/applymodel', methods=['POST', 'PUT'])
@api_json_errors
def save_default_model(datasetname):

    dataset = get_dataset(datasetname)

    if not dataset.mapping or not dataset.source:
        return jsonify({"errors":["No mapping for this dataset"]})

    if not dataset.dataorg:
        return jsonify({"errors":['Has no dataorg']})



    #get the OR instructions from dataset
    ORinstructions = dataset.source.getORInstructions()

    #get the OR instructions from dataset
    mapping = dataset.mapping

    dataorg = dataset.dataorg

    dataorg.ORTemplate = {"data": ORinstructions}
    dataorg.mappingTemplate = mapping


    db.session.commit()


    return jsonify({"success":True})




@blueprint.route('/datasets/<datasetname>/model', methods=['GET'])
#@blueprint.route('/datasets/<datasetname>/model/<sourcename>')
@api_json_errors
def model(datasetname):
    #if not sourcename then we are saving the defaults for dataset
    
    dataset = get_dataset(datasetname)
    etag_cache_keygen(dataset)
    if not dataset.source:
        return jsonify(False)
    else:
        #figure out what they need over there?
        return jsonify(dataset.source)




@blueprint.route('/datasets/<datasetname>/model', methods=['POST', 'PUT'])
@api_json_errors
def update_model_createnew(datasetname):
    #refactor to include the update

    dataset = get_dataset(datasetname)


    #source will have name and URL
    sourceapi = api_form_data()

    if not sourceapi['name']:
        sourceapi['name'] = dataset.name
        #return jsonify({"errors":["You must enter a data name " + str(e)]})

    #verify that name is unique and URL is real
    #model = {'source': source}
    schema = source_schema(ValidationState(sourceapi))
    try:
        data = schema.deserialize(sourceapi)
    except Invalid, e:
        #print message in thefuture
        return jsonify({"errors":["Invalid field " + str(e)]})

    basesource = dataset.source


    if len(request.files) == 1:
        upload_source_path = sourcefiles.save(request.files['sourcefile'])


        sourcefile = SourceFile(rawfile = upload_source_path)
        db.session.add(sourcefile)

        if basesource:
            if basesource.rawfile:
                basesource.rawfile.delete()
            basesource.rawfile = sourcefile
            source = basesource
            source.reload_openrefine()
        else:
            source = Source(dataset=dataset, name=data['name'], url=None, rawfile=sourcefile)
            db.session.add(source)

        #handle file
    elif data.get('url', None):
        if basesource:
            source = basesource
            source.name = data['name']
            source.url = data['url']
            source.reload_openrefine()
            #maybe reload the OpenRefine?
            #trigger reload
        else:
            source = Source(dataset=dataset, name=data['name'], url=data['url'])
            db.session.add(source)
    else:
        source = basesource
        source.reload_openrefine()


        #check if source exists
    if sourceapi.get('prefuncs', None):
        prefuncs = json.loads(sourceapi['prefuncs'])
        dbsave = {}
        for p in prefuncs:
            dbsave[p] = p 
        dataset.prefuncs = dbsave

    #dataset.managers.append(current_user)
    
    
    db.session.commit()

    return jsonify(source)




@blueprint.route('/datasets/<datasetname>/runmodel', methods=['POST', 'PUT'])
@api_json_errors
def update_model(datasetname):

    #we just got everything now let's save it
    sourcemeta = request.get_json().get("meta", None)
    sourcemodeler = request.get_json().get("modeler", None)
    #validate that we have everything here

    r = {"mapping":sourcemodeler}

    #let's handle the compounds
    for item in r['mapping'].values():
        if item['type'] in  ("compound", "geometry"):
            for attitem in item['attributes'].values():
                if attitem['column'] == 'countryid':
                    pass
                attitem['column'] = item['column']

    #if not hasattr(r['mapping'], 'theid'):
    r['mapping']['theid'] = {
                              "default_value": "",
                              "description": "Unique ID",
                              "datatype": "string",
                              "key": True,
                              "label": "UniqueID",
                              "column": "uniqueid",
                              "type": "attribute",
                              "form": {
                                "label": "Unique Identifier"
                                }
                            }

    r['mapping']['geom_time_id'] = {
                              "default_value": "",
                              "description": "Geometry Time ID",
                              "datatype": "integer",
                              "label": "Geometry Time ID",
                              "column": "geom_time_id",
                              "type": "geom_time_id",
                              "form": {
                                "label": "Geometry-Time ID"
                                }
                            }




    dataset = get_dataset(datasetname)
    dataset.source.addData(r)
    db.session.commit()


    load_source(dataset.source.id)
    #add async request to load data

    return jsonify({"success":True})

    #using colinder
    # require.dataset.update(dataset)
    # model_data = dataset.model_data
    # model_data['mapping'] = api_form_data()
    # schema = mapping_schema(ValidationState(model_data))
    # new_mapping = schema.deserialize(model_data['mapping'])
    # dataset.data['mapping'] = new_mapping
    # db.session.commit()
    # return model(name)




@blueprint.route('/datasets/<datasetname>/sources', methods=['DELETE'])
@api_json_errors
def delete(datasetname):
    try:
        dataset = get_dataset(datasetname)
        require.dataset.update(dataset)

        db.session.delete(dataset.source)
        db.session.commit()
        clear_index_cache()


        #drop solr index
        #solr.drop_index(source.name)
        return jsonify(True)
    except Exception, e:
        return jsonify({"errors":[e]})
    # require.dataset.update(dataset)


@blueprint.route('/datasets/<datasetname>/model/ORoperations')
@api_json_errors
def ORoperations(datasetname):
    try:
        dataset = get_dataset(datasetname)

        ORinstructions = dataset.source.getORInstructions()
        return jsonify(ORinstructions, headers= {'Cache-Control' : 'no-cache'})
    except Exception, e:
        return jsonify({"error":"Could not fetch the ORinstructions" + str(e)})




#### Default source mapping for cubes
DEFAULT_SOURCE_MAPPING = {
                            "country_level0": {
                              "attributes": {
                                "name": {
                                  "column": None,
                                  "datatype": "id",
                                  "default_value": ""
                                },
                                "label": {
                                  "column": None,
                                  "datatype": "string",
                                  "default_value": ""
                                },
                                "countryid": {  
                                   "column":"countryid",
                                   "datatype":"integer",
                                   "default_value":""
                                }
                              },
                              "type": "geometry",
                              "description": None,
                              "label": "Country",
                              "form": {
                                "label": "Country Name"
                                }
                            },
                            "amount": {
                              "default_value": "",
                              "description": None,
                              "datatype": "float",
                              "label": "Value",
                              "column": None,
                              "type": "measure",
                              "form": {
                                "label": "Indicator Value",
                                "extraoptions": {
                                    "label": "Data Type",
                                    "options": [{
                                            "code":"float",
                                            "label":"float"
                                        },
                                        {
                                            "code":"string",
                                            "label":"string"
                                        },
                                        ]
                                    }
                                }
                            },
                            "time": {
                              "default_value": "",
                              "description": None,
                              "format": None,
                              "column": None,
                              "label": "Date",
                              "datatype": "date",
                              "type": "date",
                              "form": {
                                "label": "Date/Time"
                                }
                            }
                        }