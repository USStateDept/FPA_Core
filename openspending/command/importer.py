import argparse
import logging
import sys
import os
import urllib2
import codecs
import chardet
import urlparse, urllib
import traceback

from openspending.lib import json

from openspending.model import Source, Dataset, Account, DataOrg, SourceFile
from openspending.core import db

from openspending.preprocessors.ORhelper import testORLoad

from openspending.importer import CSVImporter
from openspending.importer.analysis import analyze_csv

from openspending.validation.model import validate_model
from openspending.validation.model import Invalid

from openspending.core import sourcefiles

from settings import UPLOADED_FILES_DEST

from werkzeug import FileStorage

from shutil import copyfile


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

    print "Working on ", sourcejson['fields']['indicator']


    dataorg = DataOrg.by_name(dataproviderjson['fields']['title'])

    dataorgMeta = {
        'description': dataproviderjson['fields']['description'], 
        'label': dataproviderjson['fields']['title']
    }

    if not dataorg:
        dataorg = DataOrg(dataorgMeta)
        db.session.add(dataorg)

    #dataorg will update with id here
    db.session.commit()

    #get or create dataset
    dataset = Dataset.by_label(sourcejson['fields']['indicator'])

    description = "http://databank.edip-maps.net/admin/etldata/dataconnection/" + str(sourcejson['pk']) + "/"

    modelDataset = {'dataset': 
            {
                'label': sourcejson['fields']['indicator'],
                'name': sourcejson['fields']['indicator'],
                'description': description,
                'dataType': sourcejson['fields']['data_type'],
                'dataorg_id': dataorg.id
            }
        }

    if not dataset:
        #create one

        dataset = Dataset(modelDataset['dataset'])
        #dataset.ORoperations = dataproviderjson['fields'].get('ORoperations', {})
        #dataset.data = dataproviderjson['fields'].get('mapping',{})
        db.session.add(dataset)

    else:
        #dataset.ORoperations = dataproviderjson['fields'].get('ORoperations', {})
        #dataset.data = dataproviderjson['fields'].get('mapping',{})
        dataset.update(modelDataset['dataset'])


    db.session.commit()


    systemaccount = Account.by_id(1)

    if dataset.source:
        try:
            print "trying to delete source"
            print dataset.source
            dataset.source.delete()
        except Exception, e:
            print "could not delete source", e

    source = None


    #check if we have a file uploaded first
    if not sourcejson['fields']['webservice'] and not sourcejson['fields']['downloadedFile']:
        print "you don't have any files to use"
        return (None, False)

    if sourcejson['fields']['downloadedFile'] and file_dir and not sourcejson['fields']['webservice']:
        #convert to a file:///name
        #create a source file
        try:

            filename = sourcejson['fields']['downloadedFile'].replace("rawdata/", "")

            #copy file over to another folder and open it
            copyfile(os.path.join(file_dir, filename), os.path.join(UPLOADED_FILES_DEST, filename))

            with codecs.open(os.path.join(UPLOADED_FILES_DEST, filename), 'rb') as fh:
                wuezfile = FileStorage(stream=fh, name=filename)
                #upload_source_path = sourcefiles.save(wuezfile, name=filename, folder=UPLOADED_FILES_DEST)
                upload_source_path = sourcefiles.save(wuezfile)
                sourcefile = SourceFile(rawfile = upload_source_path)
                db.session.add(sourcefile)
        except Exception ,e:
            print "!!!!!Error failed", e
            return (None, False)
        try:
            print sourcefile
            source = Source(dataset=dataset, name=dataset.name, url=None, rawfile=sourcefile)
        except Exception, e:
            traceback.print_exc(e)
            print "Could not load source rawfile", e
            return(None, False)

    else:
        try:
            source = Source(dataset=dataset, name=dataset.name, url=sourcejson['fields']['webservice'], rawfile=None)
            
        except Exception, e:
            print "Could not load source webservice", e
            return(None, False)

    if not source:
        return (None, False)

    db.session.add(source)
    db.session.commit()

    return (source, True)



    # if len(dataset.ORoperations.keys()):
    #     source.applyORInstructions(dataset.ORoperations)
    #     source.ORoperations = dataset.ORoperations
    # else:
    #     print "can not apply the ORoperations"
    
    # #probably need to make sure this is here before we add the dynamic model
    # db.session.commit()

    # if len(dataset.data.keys()):
    #     source.addData(dataset.data)
    # else:
    #     if not meta_only:
    #         print "there was no field mapping.  Failed", dataset.label
    #         return (source, False)

    # if meta_only:
    #     return (source, True)
    

    # importer = ORImporter(source)
    # #dry run this
    # importer.run(dry_run=dry_run)
    # if importer._run.successful_sample:
    #     return (source, True)
    # else:
    #     return (source, False)



def getDataProviderJSONObj(dataconnectionjsonobj, dataproviderobjs):
    #there's a much better way to do this but who cares if it takes a little longer
    thematch = dataconnectionjsonobj['fields'].get("metadata", None)
    firstprovider = None
    for dataproviderobj in dataproviderobjs:
        if not firstprovider:
            firstprovider = dataproviderobj
            if not thematch:
                return firstprovider

        if (dataproviderobj['pk']== thematch):
            return dataproviderobj
    return firstprovider



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

    # @manager.option('--org', action="store", dest='specificorg', type=str,
    #                 default=None, metavar='N',
    #                 help="organization to load")
    # @manager.option('jsondata', nargs=argparse.REMAINDER,
    #                 help="JSON data from databank.edip-maps.net")
    # @manager.command
    # def testdatabankjson(**args):
    #     """ Load a JSON dump from  """
    #     specificorg = args.get("specificorg", None)
    #     modelobjs = parseDBJSON(args)


    #     results = {"success":0, "errored":0, "skipped":0, "added_needs_work":0}


    #     #go through the dataconnections
    #     for dataconnection in modelobjs["dataconnection"]:

    #         print "\n\n******************************************"

    #         if not dataconnection['fields'].get("data_type", None):
    #             results['skipped'] +=1
    #             continue

    #         #get the dataprovider json
    #         datasetprovider = getDataProviderJSONObj(dataconnection, modelobjs['metadata'])
    #         if not datasetprovider:
    #             results['skipped'] += 1
    #             print "could not find the meta attached to this", dataconnection['fields']['indicator']
    #             continue
    #         if specificorg and datasetprovider['fields'].get("title", "nothinghere") != specificorg:
    #             results['skipped'] += 1
    #             print "skipping unspecified organizations", datasetprovider['fields'].get("title", None)
    #             continue



    #         if dataconnection['fields']['data_type'] == "API - CSV":
    #             if dataconnection['fields']['webservice']:
    #                 myresult = testORLoad(sourceurl=dataconnection['fields']['webservice'])
    #                 if not myresult:
    #                     results['errored'] +=1
    #             else:
    #                 results['skipped'] +=1
    #             #attempt to load
    #             pass
    #         elif dataconnection['fields']['data_type'] == "API - JSON":
    #             results['skipped'] +=1
    #             #json preprocessor
    #             pass
    #         else:
    #             results['skipped'] +=1
    #             print "other not currently supported"
    #             continue




    #         #if we get here then we can try load a source
    #         sourceobj, loadresult = load_from_databank(dataconnection, datasetprovider, dry_run=True, meta_only=False)
    #         if loadresult:
    #             results['success'] +=1
    #         else:
    #             results['added_needs_work'] += 1

    #         # #if we are here then we created a source.  Let's now delete it.
    #         # #this will not delete the data tables yet
    #         # sourceobj.delete()



    #     print "\n\nHere are results:"
    #     print results




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

            if dataconnection['fields'].get('status',None) not in ['Data Source Verified']:
                results['skipped'] += 1
                print "skipping becuase of status"
                continue



            errored_rows = []
            #if we get here then we can try load a source
            try:
                sourceobj, loadresult = load_from_databank(dataconnection, datasetprovider, file_dir=file_dir, dry_run=True, meta_only=True)
            except Exception, e:
                print "!!!!!!!!!!!There was an error", e
                loadresult = False
            if loadresult:
                results['success'] +=1
            else:
                results['added_needs_work'] += 1
                errored_rows.append(dataconnection)



        print "\n\nHere are results:"
        print results
        print "\n\n Here are my errored rows"
        for d in errored_rows:
            print d




    # @manager.option('-n', '--dry-run', dest='dry_run', action='store_true',
    #                 help="Perform a dry run, don't load any data.")
    # @manager.option('-i', '--index', dest='build_indices', action='store_true',
    #                 help="Suppress Solr index build.")
    # @manager.option('--raise-on-error', action="store_true",
    #                 dest='raise_errors', default=False,
    #                 help='Get full traceback on first error.')
    # @manager.option('jsondata', nargs=argparse.REMAINDER,
    #                 help="JSON data from databank.edip-maps.net")
    # @manager.command
    # def loaddatabankjson(**args):
    #     """ Load a JSON dump from  """
    #     if len(args['jsondata']) == 0:
    #         print "you need to identify the json file from the python manage.py dumpdata etldata command"
    #         sys.exit(1)

    #     #parse the json

    #     #iterate through the json to find the etldata.dataconnections
    #         #find which method to try

    #         #add preprocessors if necessary using the type format

    #         #Load into OR

    #         #check that it is there

    #         #delete it

    #     #print report




