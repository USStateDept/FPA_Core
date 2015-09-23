#from celery.utils.log import get_task_logger
import io

#from openspending.core import create_app, create_celery
from openspending.core import db
from openspending.model.source import Source
from openspending.importer import ORImporter

import csv
from sqlalchemy import text
from dateutil.parser import *


#log = get_task_logger(__name__)

import logging
log = logging.getLogger(__name__)

#flask_app = create_app()
#celery = create_celery(flask_app)



#we are using this in-sync becuase it takes less than 1 second
# if the processing time grows, we should consider a task
#@celery.task(ignore_result=True)
def check_column(source_id, columnkey, columnvalue):
    #with flask_app.app_context():
    source = Source.by_id(source_id)
    sourcerefine = source.get_or_create_ORProject()
    #should cache this at some point
    sourcefile_export = sourcerefine.refineproj.export()
    #remove BOM from the source file
    s = sourcefile_export.read()
    u = s.decode("utf-8-sig")
    sourcefile = io.BytesIO()
    sourcefile.write(str(u))
    sourcefile_csv = csv.DictReader(sourcefile, delimiter="\t")

    arrayset = []
    for row in sourcefile_csv:
        print row[columnvalue]
        arrayset.append(row[columnvalue])

    sourcefile.close()

    returnval = {"errors":[], "message": "There was an unexpected error"}

    if columnkey == "country_level0":
        temp_geom_countries = db.session.query("country").from_statement(text("SELECT geometry__country_level0.label as country FROM public.geometry__country_level0 ")).all()
        geom_countries = [y for x in temp_geom_countries for y in x]
        temp_geom_countries = None

        returnval['message'] = "The following countries were not found:"

        for country in arrayset:
            #there is probably a better method that takes advantage of a sorted list
            if country not in geom_countries:
                #log as error
                returnval['errors'].append(country)


    elif columnkey == "time":
        returnval['message'] = "Could not parse the following dates:"
        for date_col in arrayset:
            try:
                parse(date_col)
            except Exception, e:
                returnval['errors'].append(date_col)

    elif columnkey == "indicatorvalue":
        returnval['message'] = "Could not parse the following values: "
        for val_col in arrayset:
            try:
                float(val_col)
            except:
                returnval['errors'].append(val_col)
        #check if value is actually a number

    return returnval




#@celery.task(ignore_result=True)
def load_source(source_id, sample=False):
    #with flask_app.app_context():
    source = Source.by_id(source_id)
    if not source:
        return log.error("No such source: %s", source_id)

    if not source.dataset.mapping:
        return log.error("Dataset has no mapping.")

    #we should drop this first to make sure everything loads corrctly
    source.model.drop()

    source.model.generate()
    
    importer = ORImporter(source)
    if sample:
        importer.run(dry_run=True, max_lines=1000, max_errors=1000)
    else:
        importer.run()
        #index_dataset.delay(source.dataset.name)



#@celery.task(ignore_result=True)
def ping():
    #with flask_app.app_context():
    log.info("Pong.")
