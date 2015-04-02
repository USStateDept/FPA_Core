import logging

from flask import Blueprint

from openspending.references.enumerations import DATATYPES
from openspending.preprocessors.processing_funcs import AVAILABLE_FUNCTIONS
from openspending.model import DataOrg
from openspending.lib.jsonexport import jsonify
from openspending.views.cache import etag_cache_keygen

log = logging.getLogger(__name__)
blueprint = Blueprint('meta_api2', __name__)


def dicts(d):
    for k, v in d.items():
        if isinstance(v, tuple):
            yield {'code': k, 'label': v[0], 'key': v[1]}
        else:
            yield {'code': k, 'label': v}

def fromModel(d):
    for theobj in d:
        yield {'value': theobj.id, 'label': theobj.label}


@blueprint.route('/reference')
def reference_data():
    etag_cache_keygen('england prevails')
    dataorgs = fromModel(DataOrg.get_all().all())
    return jsonify({
        'dataTypes': sorted(DATATYPES, key=lambda d: d['label']),
        'dataorgs': sorted(dataorgs, key=lambda d: d['label'])
    })


@blueprint.route('/preprocessors')
def reference_preprocessors():
    etag_cache_keygen('preprocessors_api_3')
    return jsonify(sorted(AVAILABLE_FUNCTIONS, key=lambda d: d['label']))