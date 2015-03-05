import json
from lxml import etree
import io
import csv


AVAILABLE_FUNCTIONS = {
    "json_to_csv": "JSON to CSV",
    "parse_xml_to_csv": "XML to CSV",
    "World_Bank_Check_Date_Columns": "World Bank Check Date Columns"
}


def json_to_csv(resptext):
    jsonobj = json.loads(str(resptext))
    outputfile = io.BytesIO()
    csvdictwrite = csv.DictWriter(outputfile, jsonobj[0].keys())
    rowheaders = {}
    for colkey in jsonobj[0].keys():
        rowheaders[colkey] = colkey
    csvdictwrite.writerow(rowheaders)
    for rowobj in jsonobj:
        csvdictwrite.writerow(rowobj)
    return outputfile.getvalue()

def parse_xml(xmlobj):
    root = etree.fromstring(xmlobj)

from datetime import date


def World_Bank_Check_Date_Columns(resptext):
    """
    take text and pass back text.
    """

    print "\n\n\n++++++++++++++++++++++++++++"

    tempholder = io.BytesIO(str(resptext))

    csvdictreader = csv.DictReader(tempholder)
    csvdict = []
    for therow in csvdictreader:
        csvdict.append(therow)


    print "doing this", csvdict[0].keys()
    #and these need to be in order
    if ("1960" not in csvdict[0].keys()):
        yearsneeded = {}
        for theyear in range(1960,date.today().year):
            yearsneeded[str(theyear)] = ""

        returnset = []

        for row in csvdict:
            returnset.append(row.update(yearsneeded))

        tempoutput = io.BytesIO()
        csvwrite = csv.DictWriter(tempoutput, returnset[0].keys())
        for finalrow in returnset:
            #need to order by the 1960 to 2015
            csvwrite.writerow(finalrow)
        return tempoutput.getvalue()
    else:
        return resptext




#shapefile?
#pdf?
