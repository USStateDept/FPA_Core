import logging
import tempfile
import zipfile
import io
import os
import requests
import csv

from flask import current_app, url_for

from openspending.core import db

log = logging.getLogger(__name__)


OUTPUT_TEXT = """
    %(label)s
    %(name)s
    Min/Max Values: %(minval)s / %(maxval)s
    Year Range: %(minyear)s - %(maxyear)s


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
        self.tablebase = self.dataset.name
        self.model = self.dataset.source.model

        self._buildzf()
        self._write_basefile()
        #self._write_preloaddata()
        self._perform_qa_checks()
        self._write_logs()
        self._write_loaded_data()

    def _buildzf(self):
        self.namedfile = tempfile.NamedTemporaryFile(mode='wb', delete=False)
        self.zf = zipfile.ZipFile(self.namedfile, "w")

    def _write_basefile(self):

        result = db.engine.execute("SELECT MAX(amount), MIN(amount) FROM %s__entry"%self.tablebase).first()
        if result:
            maxval= result[0]
            minval = result[1]
        else:
            minval = None
            maxval = None
        timeresult = db.engine.execute("SELECT MAX(year), MIN(year) FROM %s__time"%self.tablebase).first()
        if timeresult:
            maxyear= timeresult[0]
            minyear = timeresult[1]
        else:
            minyear = None
            maxyear = None

        # check years shown
        self.zf.writestr("metadata.csv", OUTPUT_TEXT%dict(label=self.dataset.label,
                                                        name=self.dataset.name,
                                                        maxval=maxval,
                                                        minval=minval,
                                                        minyear=minyear,
                                                        maxyear=maxyear))

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

    def _perform_qa_checks(self):
        missing_countries_file = io.StringIO()
        missing_countries_file.write(",".join(['label', 'name']) + u"\n")
        missingcountries = db.engine.execute("SELECT name, label \
                                            FROM %s__country_level0 \
                                            WHERE countryid = 0"%self.tablebase).fetchall()
        missing_countries_file.write(u"This list shows the countries that were in the original data, but were not found in the FIND country list.  They are typically aggregate regions as the is the case with the World Bank.\n")
        for row in missingcountries:
            missing_countries_file.write(",".join(row) + u"\n")
        if len(missingcountries) == 0:
            missing_countries_file.write(u'No Missing Countries\n')
        self.zf.writestr("qualitychecks/countriesnotfound.csv", missing_countries_file.getvalue().encode(encoding='UTF-8'))

        countriesnotreped_file = io.StringIO()
        countriesnotreped_file.write(",".join(['label', 'sovereignt']) + u"\n")
        countriesnotreped = db.engine.execute("SELECT gc.label,gc.sovereignt FROM geometry__country_level0 as gc \
                                            LEFT OUTER JOIN %s__country_level0 as tab \
                                            ON  gc.gid=tab.countryid WHERE tab.countryid IS null"%self.tablebase).fetchall()
        countriesnotreped_file.write(u"These are the countries that are in the FIND system, but not represented in the dataset.  Typically these are smaller countries that do not track data or their data are rolled into the soeverienty\n")
        for row1 in countriesnotreped:
            countriesnotreped_file.write(",".join(row1) + u"\n")
        if len(countriesnotreped) == 0:
            countriesnotreped_file.write(u'All counries are represented\n')
        self.zf.writestr("qualitychecks/countries-not-represented.csv", countriesnotreped_file.getvalue().encode(encoding='UTF-8'))

        dupvals_file = io.StringIO()
        dupvals_file.write(",".join(['counter', 'label', 'year']) + u"\n")
        dups_result = db.engine.execute("SELECT COUNT(*) as counter, MAX(label) as label, MAX(time) as year \
                                        FROM \
                                          public.%s__entry,  \
                                          public.geometry__country_level0,  \
                                          public.geometry__time \
                                        WHERE  \
                                          %s__entry.geom_time_id = geometry__time.id AND \
                                          geometry__time.gid = geometry__country_level0.gid \
                                          GROUP BY geom_time_id HAVING COUNT(*)>1;"%(self.tablebase, self.tablebase,)).fetchall()
        dupvals_file.write(u"This is a list of countries that have multiple year, country values.  There should only be one country for every year.\n")
        for row2 in dups_result:
            temprow = [str(x) for x in row2]
            dupvals_file.write(",".join(temprow) + u"\n")
        if len(dups_result) == 0:
            dupvals_file.write(u'There are no duplicate year-country combinations\n')
        self.zf.writestr("qualitychecks/duplicate-countries-years.csv", dupvals_file.getvalue().encode(encoding="UTF-8"))


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


