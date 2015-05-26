import argparse
import logging
import sys
import os
import urllib2
import codecs
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

from openspending.tasks import check_column, load_source


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
            #copyfile(os.path.join(file_dir, filename), os.path.join(UPLOADED_FILES_DEST, filename))

            orig_filepath = os.path.join(file_dir, filename)

            with codecs.open(orig_filepath, 'rb') as fh:
                wuezfile = FileStorage(stream=fh)
                #upload_source_path = sourcefiles.save(wuezfile, name=filename, folder=UPLOADED_FILES_DEST)
                upload_source_path = sourcefiles.save(wuezfile, name=filename)
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



def zipFiles(filestozip):

    # Open StringIO to grab in-memory ZIP contents
    s = StringIO.StringIO()

    # The zip compressor
    zf = zipfile.ZipFile(s, "w")

    for fileobj in filestozip:
        zf.writestr(fileobj['label'], fileobj['content'].getvalue())


    # Must close zip for all contents to be written
    zf.close()
    return s



import zipfile
import csv
import io
import requests

from settings import LOCKDOWNUSER, LOCKDOWNPASSWORD, LOCKDOWN_FORCE


def add_import_commands(manager):

    @manager.option('-f', '--file-dir',
                    dest='file_dir',
                    help='File Dir to output the files')
    @manager.command
    def output_logs(**args):
        filedir = args.get("file_dir", None)
        log.info("Using filedir: %s", filedir)
        if not filedir:
            log.warn("Please specify an output dir")
            sys.exit()
        try:
            f = open(os.path.join(filedir, "LogFiles.zip"), 'wb' )
        except Exception, e:
            log.warn("Could not open directory : %s", e)

        zf = zipfile.ZipFile(f, "w")

        for dataset in Dataset.all():
            if dataset.source and dataset.source.runs.first():
                datalogs = dataset.source.runs.first().records_as_json()
            else:
                log.info("Skipping : %s", dataset.name)
                continue

            if not len(datalogs):
                log.info("No Datalog for : %s", dataset.name)
                zf.writestr(dataset.name + "/loadinglog.csv", "All is well")
                continue
            
            outputfile = io.BytesIO()
            #figureout the headers

            dw = csv.DictWriter(outputfile, delimiter= ',', extrasaction='ignore', fieldnames=datalogs[0].keys())
            dw.writeheader()

            for row in datalogs:
                dw.writerow(row)
            zf.writestr(dataset.name +  "/loadinglog.csv", outputfile.getvalue())


            #write openrefine output
            preloadvalue = dataset.source.getORFile().getvalue()
            zf.writestr(dataset.name + "/preloadvalue.csv", preloadvalue)

            url = "http://localhost:5000/api/slicer/cube/geometry/cubes_aggregate?cubes=" + dataset.name + "&drilldown=geometry__time|geometry__country_level0@name&format=csv"


            # Fill in your details here to be posted to the login form.
            if LOCKDOWN_FORCE:
                payload = {
                    'username': LOCKDOWNUSER,
                    'password': LOCKDOWNPASSWORD
                }

                # Use 'with' to ensure the session context is closed after use.
                with requests.Session() as s:
                    try:
                        p = s.post('http://localhost:5000/lockdown', data=payload)

                        # An authorised request.
                        postloadvalue = s.get(url).content
                    except Exception, e:
                        log.warn("could not get authorized postload value " + str(e))
            else:

                try:
                    postloadvalue = requests.get(url).content
                except Exception, e:
                    log.warn("Could Not find post load content for " + dataset.name)

            try:
                zf.writestr(dataset.name + "/postloadvalue.csv", postloadvalue)
            except Exception, e:
                log.warn("could not write postload value")

        zf.close()
        f.close()




        #put in folder with retrieved data

        #put in with transformed data




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

            log("\n\n******************************************")



            #get the dataprovider json
            datasetprovider = getDataProviderJSONObj(dataconnection, modelobjs['metadata'])
            if not datasetprovider:
                results['skipped'] += 1
                log("could not find the meta attached to this" +  str(dataconnection['fields']['indicator']))
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



    @manager.command
    def reload_all(**args):
        """Reload all sources with mapping.  This will take a while"""

        datasets = Dataset.all().all()
        ids = []
        for dataset in datasets:
            ids.append(dataset.id)

        total = 0
        ran = 0

        for id in ids:
            dataset = Dataset.by_id(id)
            total +=1
            #has mapping and source
            if dataset.mapping and dataset.source:
                print "working on ", dataset
                load_source(dataset.source.id)
                ran +=1

        print "Ran", ran, "out of", total



        #get all datasets

        #iterate through them

        # if mapping exists
            #then do a load_source function from tasks.py




    @manager.option('jsondata', nargs=argparse.REMAINDER,
                    help="JSON data from databank.edip-maps.net")
    @manager.command
    def importdataorgs(**args):
        """ Load a JSON dump from  """

        print "You probably shouldn't be using this.  If you're sure chage the code to import sources.  Make sure it doesn't override what exists in teh DB"
        sys.exit()


        import json

        from openspending.model import Dataset, DataOrg

        jsonpath = args.get('jsondata', None)[0]
        print jsonpath

        try:
            f = open(jsonpath, 'rb')
        except Exception, e:
            print "failed to open", jsonpath
            print e
            sys.exit()

        djangodump = json.load(f)

        f.close()



        metadata = [] 
        dataconnections = []
        for obj in djangodump:
          if obj['model'] == "etldata.metadata":
               metadata.append(obj)
          elif obj['model'] == "etldata.dataconnection":
            dataconnections.append(obj)


        for dataobj in dataconnections:
            datasetflask = Dataset.by_label(dataobj['fields']['indicator'])
            if not datasetflask:
                print "Could not find ", dataobj['fields']['indicator']
                continue
            print "\nworking on ", datasetflask

            for met in metadata:
                if dataobj['fields']['metadata'] == met['pk']:
                    dataorgobj = DataOrg.by_name(met['fields']['title'])
                    if not dataorgobj:
                        #create new one
                        datasetflask = DataOrg({"label":met['fields']['title'], "description":met['fields']['description']})
                        db.session.add(datasetflask)
                        datasetflask.dataorg = datasetflask
                        print "created a new one"
                    else:
                        datasetflask.dataorg = dataorgobj
                        print "adding to existing"
                    db.session.commit()
