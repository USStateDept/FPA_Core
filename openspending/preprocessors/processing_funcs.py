import json
from lxml import etree
import io
import csv


AVAILABLE_FUNCTIONS = {
	"json_to_csv": "JSON to CSV",
	"parse_xml_to_csv": "XML to CSV",
	"World_Bank_Check_Date_Columns": "World Bank Check Date Columns"
}


def json_to_csv(jsonobj):
	return jsonobj

def parse_xml(xmlobj):
	root = etree.fromstring(xmlobj)

from datetime import date


def World_Bank_Check_Date_Columns(resptext):

	print "\n\n\n++++++++++++++++++++++++++++"

	tempholder = io.BytesIO()

	tempholder.write(resptext)

	csvdict = csv.DictReader(tempholder)



	print "doing this", csvdict.fieldnames
	if ("1960" not in csvdict.fieldnames):
		yearsneeded = {}
		for theyear in range(1960,date.today().year):
			yearsneeded[str(theyear)] = ""

		returnset = []
		for row in csvdict:
			output.writerows(row.update(yearsneeded))
		return returnset
	else:
		return csvdict




#shapefile?
#pdf?
