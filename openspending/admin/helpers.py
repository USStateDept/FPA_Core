import logging
import tempfile
import zipfile
import io
import os
import requests
import csv

from flask import current_app, url_for

log = logging.getLogger(__name__)


OUTPUT_TEXT = """
    %(label)s
    Put more information here


"""


#from openspending.admin.helpers import LoadReport;from openspending.model import Dataset;a=Dataset.all()[6];lr =LoadReport(a);lr.get_output()

class LoadReport(object):
    def __init__(self, dataset=None):
        if not dataset:
            raise Exception("No Dataset")
        if not dataset.source:
            raise Exception("No Source for dataset")
        self.dataset = dataset
        self.namedfile = None
        self.zf = None

        self._buildzf()
        self._write_basefile()
        #self._write_preloaddata()
        self._write_logs()
        self._write_loaded_data()

    def _buildzf(self):
        self.namedfile = tempfile.NamedTemporaryFile(mode='wb', delete=False)
        self.zf = zipfile.ZipFile(self.namedfile, "w")

    def _write_basefile(self):
        self.zf.writestr("metadata.csv", OUTPUT_TEXT%dict(label=self.dataset.label))

    def _write_logs(self):

        if not self.dataset.source.runs.first():
            self.zf.writestr("errorlog.csv", "This dataset has not been loaded yet.")
            return 

        datalogs = self.dataset.source.runs.first().records_as_json()


        if not len(datalogs):
            self.zf.writestr("errorlog.csv", "No Errors to report")
            return

        
        outputfile = io.BytesIO()
        #figureout the headers

        dw = csv.DictWriter(outputfile, delimiter= ',', extrasaction='ignore', fieldnames=datalogs[0].keys())
        dw.writeheader()

        for row in datalogs:
            dw.writerow(row)
        self.zf.writestr("errorlog.csv", outputfile.getvalue())

    def _write_preloaddata(self):
        preloadvalue = self.dataset.source.getORFile().getvalue()
        self.zf.writestr("preloadvalue.csv", preloadvalue)


    def _write_loaded_data(self):
        client = current_app.test_client()
        
        url = "/api/slicer/cube/geometry/cubes_aggregate?cubes=" + self.dataset.name + "&drilldown=geometry__time|geometry__country_level0@name&format=csv"

        with client:
            # Fill in your details here to be posted to the login form.
            LOCKDOWN_FORCE = current_app.config.get("LOCKDOWN_FORCE", False)
            LOCKDOWNUSER = current_app.config.get("LOCKDOWNUSER")
            LOCKDOWNPASSWORD = current_app.config.get("LOCKDOWNPASSWORD")
            if LOCKDOWN_FORCE:
                payload = {
                    'username': LOCKDOWNUSER,
                    'password': LOCKDOWNPASSWORD
                }

                client.post(url_for('home.lockdown'), data=payload, follow_redirects=True)

            try:
                postloadvalue = client.get(url, follow_redirects=True).data
            except Exception, e:
                log.warn("Could Not find post load content for " + dataset.name)

        try:
            self.zf.writestr("postloadvalue.csv", postloadvalue)
        except Exception, e:
            print e
            log.warn("could not write postload value")

    def get_output(self):
        #return the zip value as a string
        self.zf.close()
        self.namedfile.close()
        returnstring = ""
        with open(self.namedfile.name, 'rb') as f:
            returnstring = f.read()
        self.cleanup()
        return returnstring

    def cleanup(self):
        try:
            os.remove(self.namedfile.name)
        except:
            log.info("cannot remove temporary file")
        #shutils.rm(self.namedfile.path


