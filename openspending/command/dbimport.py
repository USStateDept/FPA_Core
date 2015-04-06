import argparse
import logging
import sys
import os
import urllib2
import urlparse, urllib

from openspending.lib import json

from openspending.model import Source, Dataset, Account, DataOrg, SourceFile, MetadataOrg
import openspending.model
from openspending.core import db

from json import dumps
import zipfile


log = logging.getLogger(__name__)



def add_import_commands(manager):

    @manager.option('outputfile', nargs=argparse.REMAINDER,
                    help="Output file destination")
    @manager.command
    def output_json(**args):
        """ Output JSON data  """
        outputfile = args.get('outputfile', None)

        if len(outputfile) != 1:
            print "You need to specific one and only one output file"
            return

        outputfile = outputfile[0]

        #need to load in this order for relations
            #metadataorg
            #dataorg
            #source
            #sourcefile
                #wrap up files
            #dataset

        outputobj = []

        for metadataorg in MetadataOrg.all().all():
            outputobj.append(metadataorg.to_json_dump())

        for dataorg in DataOrg.all().all():
            outputobj.append(dataorg.to_json_dump())

        for source in Source.all().all():
            outputobj.append(source.to_json_dump())

        for sourcefile in SourceFile.all().all():

            outputobj.append(sourcefile.to_json_dump())

        for dataset in Dataset.all().all():
            outputobj.append(dataset.to_json_dump())



        with open(outputfile, 'wb') as f:
            json.dump(outputobj, f)

        print "success"
        print "written to ", outputfile


    @manager.option('inputfile', nargs=argparse.REMAINDER,
                    help="inputfile file destination")
    @manager.command
    def input_json(**args):
        """ inputjson JSON data  """
        inputfile = args.get('inputfile', None)

        if len(inputfile) != 1:
            print "You need to specific one and only one output file"
            return

        inputfile = inputfile[0]

        try:
            f = open(inputfile, 'rb')
        except:
            print "file not found"

        inputobj = json.load(f)

        f.close()

        modeldict = {'MetadataOrg' : [],'DataOrg' : [],'Source' : [],'SourceFile' : [],'Dataset' : []}

        for theobj in inputobj:
            if theobj['model'] not in modeldict.keys():
                modeldict[theobj['model']] = [theobj]
            else:
                modeldict[theobj['model']].append(theobj)

        theorder = ['MetadataOrg','DataOrg','Source','SourceFile','Dataset']
        ordermapping = {'metadataorg': 'MetadataOrg','dataorg':'DataOrg','source':'Source','sourcefile':'SourceFile','dataset':'Dataset'}

        for orderitem in theorder:
            modelclass = getattr(openspending.model, orderitem)
            print modelclass
            for theobj in modeldict[orderitem]:
                for objkey in theobj['fields'].keys():
                    try:
                        if objkey.find("_id") != -1:
                            #need to find the object assoicated ot this and repopulate
                            modelobjstr = objkey.split('_')[0]
                            searchpk = theobj['fields'][objkey]
                            for foreignkeymod in modeldict[modelobjstr]:
                                if foreignkeymod['pk'] == searchpk:
                                    foreignmodelclass = getattr(openspending.model, ordermapping[modelobjstr])
                                    theobj[objkey] = foreignmodelclass.by_id(foreignkeymod['theid'])

                            
                    except:
                        pass


                theid = modelclass.import_json_dump(theobj)
                theobj['theid'] = theid


                
                #cehck the field keys to see if it has a foreignkey



        #wrapup files



  #   import zipfile


  #   def zipFiles(filestozip):

  #       # Open StringIO to grab in-memory ZIP contents
  #       s = StringIO.StringIO()

  #       # The zip compressor
  #       zf = zipfile.ZipFile(s, "w")

  #       for fileobj in filestozip:
  #           zf.writestr(fileobj['label'], fileobj['content'].getvalue())


  #       # Must close zip for all contents to be written
  #       zf.close()
  #       return s

  # def full_output_csv(self):
  #       outputfile = io.BytesIO()
  #       #figureout the headers

  #       dw = csv.DictWriter(outputfile, delimiter= '\t', extrasaction='ignore', fieldnames=self.cbpfile_header)
  #       dw.writeheader()

  #       for person in self.personList:
  #           for rowid, rowval in person.getEventRows():
  #               dw.writerow(rowval)

  #       return outputfile


  #   if request.method == 'POST':
  #       form = fileUploadForm(request.POST, request.FILES)
  #       if form.is_valid():
  #           cbpData = process_adis_file(request.FILES['file'])
  #           if request.POST.get("showpreview", None):
  #               return render_to_response('ADIS_upload.html', RequestContext(request, {
  #                   'form': form,
  #               }))
  #           else:
  #               responseFiles = [
  #                                   {'label': 'resultset.csv',
  #                                    'content': cbpData.full_output_csv()
  #                                    },
  #                                   {'label': 'removedrows.csv',
  #                                    'content': cbpData.full_removed_rows()
  #                                    },           
  #                                   {'label': 'summaryoutput.csv',
  #                                    'content': cbpData.full_summary()
  #                                    }                             
  #                               ]
  #               outputstring = zipFiles(responseFiles)
  #               resp = HttpResponse(outputstring.getvalue(), content_type="application/x-zip-compressed")
  #               resp['Content-Disposition'] = 'attachment;filename=Development_Status_.zip'
                
  #               return resp
