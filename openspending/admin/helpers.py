import tempfile
import zipfile
import io
import requests

from flask import current_app

OUTPUT_TEXT = """
    %(label)s
    Put more information here


"""


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
        self._write_preloaddata()

    def _buildzf(self):
        self.namedfile = tempfile.NamedTemporaryFile(mode='wb', delete=False)
        self.zf = zipfile.ZipFile(f, "w")

    def _write_basefile(self):
        zf.writestr("datainfo.csv", OUTPUT_TEXT%dict(label=self.dataset.label))

    def _write_logs(self):

        datalogs = self.dataset.source.runs.first().records_as_json()


        if not len(datalogs):
            zf.writestr("loadinglog.csv", "All is well")
            return

        
        outputfile = io.BytesIO()
        #figureout the headers

        dw = csv.DictWriter(outputfile, delimiter= ',', extrasaction='ignore', fieldnames=datalogs[0].keys())
        dw.writeheader()

        for row in datalogs:
            dw.writerow(row)
        self.zf.writestr("loadinglog.csv", outputfile.getvalue())

    def _write_preloaddata(self):
        preloadvalue = self.dataset.source.getORFile().getvalue()
        self.zf.writestr("preloadvalue.csv", preloadvalue)


    def _write_loaded_data(self):
        current_app.test_client()
        

        # Fill in your details here to be posted to the login form.
        LOCKDOWN_FORCE = current_app.config.get("LOCKDOWNUSER", False)
        LOCKDOWNUSER = current_app.config.get("LOCKDOWNUSER")
        LOCKDOWNPASSWORD = current_app.config.get("LOCKDOWNUSER")
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








def output_logs(dataset=None):
    """
        zipfile
         |
          - dataset info
          - log records 
          - output
    """

    if not dataset:
        return "No dataset"

    f = tempfile.NamedTemporaryFile(mode='wb', delete=False)



    zf = zipfile.ZipFile(f, "w")





    #write openrefine output


    url = "http://localhost:5000/api/slicer/cube/geometry/cubes_aggregate?cubes=" + dataset.name + "&drilldown=geometry__time|geometry__country_level0@name&format=csv"


