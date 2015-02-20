import json
from lxml import etree


AVAILABLE_FUNCTIONS = {
	"json_to_csv": "JSON to CSV",
	"parse_xml_to_csv": "XML to CSV"
}


def json_to_csv(jsonobj):
	return jsonobj

def parse_xml(xmlobj):
	root = etree.fromstring(xmlobj)

#shapefile?
#pdf?
