import logging

from sqlalchemy.sql.expression import select, func
from sqlalchemy.orm import aliased

from openspending.core import db, cache
from openspending.lib.util import cache_hash
from openspending.lib.helpers import url_for
from openspending.model.dataset import Dataset


log = logging.getLogger(__name__)



def dataset_index(account, source=None):
    # Get all of the public datasets ordered by when they were last updated
    results = Dataset.all_by_account(account, order=False)
    results = results.order_by(Dataset.updated_at.desc())


    # Filter category if that has been provided
    if source:
        results = results.filter(Dataset.source == source)

    return list(results)


@cache.memoize()
def cached_index(account, source=None):
    """ A proxy function to run cached calls against the dataset
    index (dataset index page and dataset.json). """
    datasets = dataset_index(account, source)
    return {
        'datasets': map(lambda d: d.as_dict(), datasets),
        #'source': source_index
    }

cached_index.make_cache_key = cache_hash


def clear_index_cache():
    """ Delete all cached index representations. """
    cache.delete_memoized(cached_index)
