import argparse
import logging
import sys
import os
import urllib2
import urlparse, urllib

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





def load_from_databank(sourcejson, dataproviderjson, dry_run=False, overwrite=True, meta_only=False, file_dir = None):

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
        dataset.ORoperations = dataproviderjson['fields'].get('ORoperations', {})
        dataset.data = dataproviderjson['fields'].get('mapping',{})
        db.session.add(dataset)

    else:
        dataset.ORoperations = dataproviderjson['fields'].get('ORoperations', {})
        dataset.data = dataproviderjson['fields'].get('mapping',{})
        dataset.update(modelDataset['dataset'])


    db.session.commit()


    systemaccount = Account.by_id(1)

    if sourcejson['fields'].get('indicator', None):
        tempsource = Source.by_source_name(sourcejson['fields'].get('indicator'))
        if tempsource:
            tempsource.delete()
    else:
        print "your source does not have a title"
        return (None, False)

    #check if we have a file uploaded first
    if not sourcejson['fields']['webservice'] and not sourcejson['fields']['downloadedFile']:
        print "you don't have any files to use"
        return (None, False)

    if sourcejson['fields']['downloadedFile'] and file_dir and not sourcejson['fields']['webservice']:
        #convert to a file:///name
        filename = sourcejson['fields']['downloadedFile'].split("/")[1]
        sourcejson['fields']['webservice'] = urlparse.urljoin('file:', urllib.pathname2url(os.path.join(file_dir,filename )))



    if not sourcejson['fields']['webservice']:
        print "you don't have a webservice (or a file in the future)"
        return (None, False)

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

    if sourcejson['fields']['downloadedFile']:
        sys.exit()



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
        if not meta_only:
            print "there was no field mapping.  Failed", dataset.label
            return (source, False)

    if meta_only:
        return (source, True)
    

    importer = ORImporter(source)
    #dry run this
    importer.run(dry_run=dry_run)
    if importer._run.successful_sample:
        return (source, True)
    else:
        return (source, False)



def getDataProviderJSONObj(dataconnectionjsonobj, dataproviderobjs):
    #there's a much better way to do this but who cares if it takes a little longer
    thematch = dataconnectionjsonobj['fields'].get("metadata", None)
    if not thematch:
        return False

    for dataproviderobj in dataproviderobjs:

        if (dataproviderobj['pk']== thematch):
            return dataproviderobj
    return False



def parseDBJSON(args):
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

    return modelobjs






def add_import_commands(manager):

    @manager.option('--org', action="store", dest='specificorg', type=str,
                    default=None, metavar='N',
                    help="organization to load")
    @manager.option('jsondata', nargs=argparse.REMAINDER,
                    help="JSON data from databank.edip-maps.net")
    @manager.command
    def testdatabankjson(**args):
        """ Load a JSON dump from  """
        specificorg = args.get("specificorg", None)
        modelobjs = parseDBJSON(args)


        results = {"success":0, "errored":0, "skipped":0, "added_needs_work":0}


        #go through the dataconnections
        for dataconnection in modelobjs["dataconnection"]:

            print "\n\n******************************************"

            if not dataconnection['fields'].get("data_type", None):
                results['skipped'] +=1
                continue

            #get the dataprovider json
            datasetprovider = getDataProviderJSONObj(dataconnection, modelobjs['metadata'])
            if not datasetprovider:
                results['skipped'] += 1
                print "could not find the meta attached to this", dataconnection['fields']['indicator']
                continue
            if specificorg and datasetprovider['fields'].get("title", "nothinghere") != specificorg:
                results['skipped'] += 1
                print "skipping unspecified organizations", datasetprovider['fields'].get("title", None)
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




            #if we get here then we can try load a source
            sourceobj, loadresult = load_from_databank(dataconnection, datasetprovider, dry_run=True, meta_only=False)
            if loadresult:
                results['success'] +=1
            else:
                results['added_needs_work'] += 1

            # #if we are here then we created a source.  Let's now delete it.
            # #this will not delete the data tables yet
            # sourceobj.delete()



        print "\n\nHere are results:"
        print results





    @manager.option('-n', '--dry-run', dest='dry_run', action='store_true',
                    help="Perform a dry run, don't load any data.")
    @manager.option('-i', '--index', dest='build_indices', action='store_true',
                    help="Suppress Solr index build.")
    @manager.option('--raise-on-error', action="store_true",
                    dest='raise_errors', default=False,
                    help='Get full traceback on first error.')
    @manager.option('-f', '--file-dir',
                    dest='file_dir',
                    help='File Dir of the uploaded Files')
    @manager.option('jsondata', nargs=argparse.REMAINDER,
                    help="JSON data from databank.edip-maps.net")
    @manager.command
    def loadmetaonlyjson(**args):
        """ Load a JSON dump from  """
        specificorg = args.get("specificorg", None)
        file_dir = args.get('file_dir', None)
        modelobjs = parseDBJSON(args)

        results = {"success":0, "errored":0, "skipped":0, "added_needs_work":0}


        #go through the dataconnections
        for dataconnection in modelobjs["dataconnection"]:

            print "\n\n******************************************"



            #get the dataprovider json
            datasetprovider = getDataProviderJSONObj(dataconnection, modelobjs['metadata'])
            if not datasetprovider:
                results['skipped'] += 1
                print "could not find the meta attached to this", dataconnection['fields']['indicator']
                continue
            if specificorg and datasetprovider['fields'].get("title", "nothinghere") != specificorg:
                results['skipped'] += 1
                print "skipping unspecified organizations", datasetprovider['fields'].get("title", None)
                continue



            #if we get here then we can try load a source
            sourceobj, loadresult = load_from_databank(dataconnection, datasetprovider, file_dir=file_dir, dry_run=True, meta_only=True)
            if loadresult:
                results['success'] +=1
            else:
                results['added_needs_work'] += 1


        print "\n\nHere are results:"
        print results




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




