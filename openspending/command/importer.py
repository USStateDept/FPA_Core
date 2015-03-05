import argparse
import logging
import sys
import os
import urllib2
import urlparse

from openspending.lib import json

from openspending.model import Source, Dataset, Account, View
from openspending.core import db

from openspending.preprocessors.ORhelper import testORLoad

from openspending.importer import CSVImporter
from openspending.importer.analysis import analyze_csv

from openspending.command.archive import get_url_filename

from openspending.validation.model import validate_model
from openspending.validation.model import Invalid


from openspending.importer import ORImporter

log = logging.getLogger(__name__)

SHELL_USER = 'system'











def shell_account():
    account = Account.by_name(SHELL_USER)
    if account is not None:
        return account
    account = Account()
    account.name = SHELL_USER
    db.session.add(account)
    return account


def _is_local_file(url):
    """
    Check to see if the provided url is a local file. Returns True if it is
    and False if it isn't. This method only checks if their is a scheme
    associated with the url or not (so file:location will be regarded as a url)
    """

    # Parse the url and check if scheme is '' (no scheme)
    parsed_result = urlparse.urlparse(url)
    return parsed_result.scheme == ''


def json_of_url(url):
    # Check if it's a local file
    if _is_local_file(url):
        # If it is we open it as a normal file
        return json.load(open(url, 'r'))
    else:
        # If it isn't we open the url as a file
        return json.load(urllib2.urlopen(url))


def create_view(dataset, view_config):
    """
    Create view for a provided dataset from a view provided as dict
    """

    # Check if it exists (if not we create it)
    existing = View.by_name(dataset, view_config['name'])
    if existing is None:
        # Create the view
        view = View()

        # Set saved configurations
        view.widget = view_config['widget']
        view.state = view_config['state']
        view.name = view_config['name']
        view.label = view_config['label']
        view.description = view_config['description']
        view.public = view_config['public']

        # Set the dataset as the current dataset
        view.dataset = dataset

        # Try and set the account provided but if it doesn't exist
        # revert to shell account
        view.account = Account.by_name(view_config['account'])
        if view.account is None:
            view.account = shell_account()

        # Commit view to database
        db.session.add(view)
        db.session.commit()


def get_model(model):
    """
    Get and validate the model. If the model doesn't validate we exit the
    program.
    """

    # Get and parse the model
    model = json_of_url(model)

    # Validate the model
    try:
        log.info("Validating model")
        model = validate_model(model)
    except Invalid as i:
        log.error("Errors occured during model validation:")
        for field, error in i.asdict().items():
            log.error("%s: %s", field, error)
        sys.exit(1)

    # Return the model
    return model


def get_or_create_dataset(model):
    """
    Based on a provided model we get the model (if it doesn't exist we
    create it).
    """

    # Get the dataset by the name provided in the model
    dataset = Dataset.by_name(model['dataset']['name'])

    # If the dataset wasn't found we create it
    if dataset is None:
        dataset = Dataset(model)
        db.session.add(dataset)
        db.session.commit()

    # Log information about the dataset and return it
    log.info("Dataset: %s", dataset.name)
    return dataset


def import_csv(dataset, url, args):
    """
    Import the csv data into the dataset
    """

    csv_data_url, source_url = url
    source = Source(dataset, shell_account(),
                    csv_data_url)
    # Analyse the csv data and add it to the source
    # If we don't analyse it we'll be left with a weird message
    source.analysis = analyze_csv(csv_data_url)
    # Check to see if the dataset already has this source
    for source_ in dataset.sources:
        if source_.url == csv_data_url:
            source = source_
            break
    db.session.add(source)
    db.session.commit()

    dataset.generate()
    importer = CSVImporter(source)
    importer.run(**args)

    # Check if imported from the file system (source and data url differ)
    if csv_data_url != source_url:
        # If we did, then we must update the source url based on the
        # sources in the dataset model (so we need to fetch the source again
        # or else we'll add a new one)
        source = Source.by_id(source.id)
        source.url = source_url
        db.session.commit()


def import_views(dataset, views_url):
    """
    Import views into the provided dataset which are defined in a json object
    located at the views_url
    """

    # Load the json and loop over its 'visualisations' property
    for view in json_of_url(views_url)['visualisations']:
        create_view(dataset, view)


def load_from_databank(sourcejson, dataproviderjson, dry_run=False, overwrite=True):

    #get or create dataset
    dataset = Dataset.by_name(dataproviderjson['fields']['title'])

    modelDataset = {'dataset': 
            {
                'label': dataproviderjson['fields']['title'],
                #slugify the name
                'name': dataproviderjson['fields']['title'],
                'description': dataproviderjson['fields']['description'],
                'currency': None,
                'category': None,
                'currency': None,
                'serp_title': dataproviderjson['fields']['title'],
                'serp_teaser': dataproviderjson['fields']['description']

            }
        }

    if not dataset:
        #create one

        dataset = Dataset(modelDataset)
        dataset.ORoperations = dataproviderjson['fields']['ORoperations']
        dataset.data = dataproviderjson['fields']['mapping']
        db.session.add(dataset)

    else:
        dataset.ORoperations = dataproviderjson['fields']['ORoperations']
        dataset.data = dataproviderjson['fields']['mapping']
        dataset.update(modelDataset['dataset'])


    db.session.commit()


    systemaccount = Account.by_id(1)

    if sourcejson['fields'].get('indicator', None):
        tempsource = Source.by_source_name(sourcejson['fields'].get('indicator'))
        if tempsource:
            tempsource.delete()
    else:
        print "your source does not have a title"
        return False

    source = Source(dataset=dataset, 
                    creator=systemaccount, 
                    url=sourcejson['fields'].get('webservice'), 
                    name=sourcejson['fields'].get('indicator'),
                    prefuncs = dataproviderjson['fields'].get("prefuncs", {}))

    # print "###############raw prefuncs", dataproviderjson['fields'].get("prefuncs")
    # if len(dataproviderjson['fields'].get("prefuncs", {}).keys()):
    #     source.prefuncs = dataproviderjson['fields'].get("prefuncs", {})

    db.session.add(source)

    db.session.commit()



    if len(dataset.ORoperations.keys()):
        source.applyORInstructions(dataset.ORoperations)
        source.ORoperations = dataset.ORoperations
    else:
        print "can not apply the ORoperations"
    
    #probably need to make sure this is here before we add the dynamic model
    db.session.commit()

    if len(dataset.data.keys()):
        source.addData(dataset.data)
    else:

        print "there was no field mapping.  Failed", dataset.label
        return False
    

    importer = ORImporter(source)
    #dry run this
    importer.run(dry_run=dry_run)
    if importer._run.successful_sample:
        return True
    else:
        return False



def getDataProviderJSONObj(dataconnectionjsonobj, dataproviderobjs):
    #there's a much better way to do this but who cares if it takes a little longer
    thematch = dataconnectionjsonobj['fields'].get("metadata", None)
    if not thematch:
        return False

    for dataproviderobj in dataproviderobjs:

        if (dataproviderobj['pk']== thematch):
            return dataproviderobj
    return False



def map_source_urls(model, urls):
    """
    Go through the source urls of the dataset model and map them to the
    files or urls. Returns a dict where the key is the url and the value
    is how it should be represented in the dataset.
    """

    # Create map from file to model sources
    source_files = {get_url_filename(s): s
                    for s in model['dataset'].get('sources', [])}

    # Return a map for the representation of csv urls
    return {u: source_files.get(os.path.basename(u), u) for u in urls}


def add_import_commands(manager):

    @manager.option('-n', '--dry-run', dest='dry_run', action='store_true',
                    help="Perform a dry run, don't load any data.")
    @manager.option('-i', '--index', dest='build_indices', action='store_true',
                    help="Suppress Solr index build.")
    @manager.option('--max-lines', action="store", dest='max_lines', type=int,
                    default=None, metavar='N',
                    help="Number of lines to import.")
    @manager.option('--raise-on-error', action="store_true",
                    dest='raise_errors', default=False,
                    help='Get full traceback on first error.')
    @manager.option('--model', action="store", dest='model',
                    default=None, metavar='url', required=True,
                    help="URL of JSON format model (metadata and mapping).")
    @manager.option('--visualisations', action="store", dest="views",
                    default=None, metavar='url/file',
                    help="URL/file of JSON format visualisations.")
    @manager.option('dataset_urls', nargs=argparse.REMAINDER,
                    help="Dataset file URLs")
    @manager.command
    def csvimport(**args):
        """ Load a CSV dataset """
        # Get the model
        model = get_model(args['model'])

        # Get the source map (data urls to models)
        source_map = map_source_urls(model, args['dataset_urls'])

        # Get the dataset for the model
        dataset = get_or_create_dataset(model)

        # For every url in mapped dataset_urls (arguments) we import it
        for urlmap in source_map.iteritems():
            import_csv(dataset, urlmap, args)

        # Import visualisations if there are any
        if args['views']:
            import_views(dataset, args['views'])


    @manager.option('jsondata', nargs=argparse.REMAINDER,
                    help="JSON data from databank.edip-maps.net")
    @manager.command
    def testdatabankjson(**args):
        """ Load a JSON dump from  """
        if len(args['jsondata']) != 1:
            print "\n\nPlease specify one and only one json dump from python manage.py etldata dumpdata"
            sys.exit(1)

        try:
            jsonfile = open(args['jsondata'][0], 'rb')
        except Exception, e:
            print "failed to open file"
            print e
            sys.exit(1)

        try:
            databankjson = json.load(jsonfile)
        except Exception, e:
            print "\n\nYou hit an error on json loading"
            print e
            sys.exit(1)

        #split the objects to their approrpirate spot
        modelobjs = {}

        for jsonobj in databankjson:
            modelname = jsonobj['model'].split(".")[1]
            if modelname in modelobjs.keys():
                modelobjs[modelname].append(jsonobj)
            else:
                modelobjs[modelname] = [jsonobj]

        for modelname,obj in modelobjs.iteritems():
            print "you have ", len(obj), modelname


        results = {"success":0, "errored":0, "skipped":0, "added_needs_work":0}


        #go through the dataconnections
        for dataconnection in modelobjs["dataconnection"]:

            print "\n\n******************************************"

            if not dataconnection['fields'].get("data_type", None):
                continue

             

            if dataconnection['fields']['data_type'] == "API - CSV":
                if dataconnection['fields']['webservice']:
                    myresult = testORLoad(sourceurl=dataconnection['fields']['webservice'])
                    if not myresult:
                        results['errored'] +=1
                else:
                    results['skipped'] +=1
                #attempt to load
                pass
            elif dataconnection['fields']['data_type'] == "API - JSON":
                results['skipped'] +=1
                #json preprocessor
                pass
            else:
                results['skipped'] +=1
                print "other not currently supported"
                continue

            #get the dataprovider json
            datasetprovider = getDataProviderJSONObj(dataconnection, modelobjs['metadata'])
            if not datasetprovider:
                print "could not find the meta attached to this", dataconnection['fields']['indicator']
                continue


            #if we get here then we can try load a source
            loadresult = load_from_databank(dataconnection, datasetprovider, dry_run=True)
            if loadresult:
                results['success'] +=1
            else:
                results['added_needs_work'] += 1




        print "\n\nHere are results:"
        print results






        #iterate through the json to find the etldata.dataconnections
            #find which method to try

            #add preprocessors if necessary using the type format

            #Load into OR

            #check that it is there

            #delete it

        #print report




    @manager.option('-n', '--dry-run', dest='dry_run', action='store_true',
                    help="Perform a dry run, don't load any data.")
    @manager.option('-i', '--index', dest='build_indices', action='store_true',
                    help="Suppress Solr index build.")
    @manager.option('--raise-on-error', action="store_true",
                    dest='raise_errors', default=False,
                    help='Get full traceback on first error.')
    @manager.option('jsondata', nargs=argparse.REMAINDER,
                    help="JSON data from databank.edip-maps.net")
    @manager.command
    def loaddatabankjson(**args):
        """ Load a JSON dump from  """
        if len(args['jsondata']) == 0:
            print "you need to identify the json file from the python manage.py dumpdata etldata command"
            sys.exit(1)

        #parse the json

        #iterate through the json to find the etldata.dataconnections
            #find which method to try

            #add preprocessors if necessary using the type format

            #Load into OR

            #check that it is there

            #delete it

        #print report




