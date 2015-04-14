# -*- coding: utf-8 -*-
from cubes.providers import ModelProvider
from cubes.model import Cube, Measure, MeasureAggregate, Dimension
#from cubes.backends.sql.store import SQLStore, OPTION_TYPES
#from cubes.stores import Store
from cubes.sql.store import SQLStore, OPTION_TYPES
from cubes.errors import NoSuchCubeError, NoSuchDimensionError
from cubes.common import coalesce_options
from cubes.logging import get_logger

from openspending.core import db
from openspending.model import Dataset, Source
from openspending.lib.helpers import get_dataset

from openspending.lib.cubes_util import getGeomCube

from settings import SQLALCHEMY_DATABASE_URI



class OpenSpendingModelProvider(ModelProvider):
    __extension_name__ = 'openspending'

    def __init__(self, *args, **kwargs):
        super(OpenSpendingModelProvider, self).__init__(*args, **kwargs)

    def requires_store(self):
        return True

    #metaonly = False
    def cube(self, name, locale=None, namespace=None, metaonly=None):
        print "just not doing this=========================="

        if name == "geometry":
            return getGeomCube(self, metaonly)

        dataset = get_dataset(name)
        if name is None:
            raise NoSuchCubeError("Unknown dataset %s" % name, name)



        mappings = {}
        joins = []
        fact_table = dataset.source.model.table.name

        aggregates = [MeasureAggregate('num_entries',
                                       label='Number of entries',
                                       function='count')]
        measures = []
    #         "wma": partial(_window_function_factory, window_function=weighted_moving_average, label='Weighted Moving Avg. of {measure}'),
    # "sma": partial(_window_function_factory, window_function=simple_moving_average, label='Simple Moving Avg. of {measure}'),
    # "sms": partial(_window_function_factory, window_function=simple_moving_sum, label='Simple Moving Sum of {measure}'),
        aggregation_funcs = ["wma", "sma", "sms"]

        for measure in dataset.source.model.measures:
            cubes_measure = Measure(measure.name, label=measure.label)
            measures.append(cubes_measure)
            for agg_func in aggregation_funcs:
                aggregate = MeasureAggregate(measure.name + "_" + agg_func,
                                             label=measure.label  + agg_func,
                                             measure=measure.name,
                                             function=agg_func)
                aggregates.append(aggregate)

        dimensions = []
        for dim in dataset.source.model.dimensions:
            meta = dim.to_cubes(mappings, joins)
            meta.update({'name': dim.name, 'label': dim.label})
            dimensions.append(Dimension.from_metadata(meta))



        cube_meta = {"name":dataset.name,
                                "fact":fact_table,
                                "aggregates":aggregates,
                                "measures":measures,
                                #change these when they get addeed to the model
                                "label":dataset.name,
                                "description":"non null description",
                                "dimensions":dimensions,
                                "store":self.store,
                                "mappings":mappings,
                                "joins":joins}


        if metaonly:
            return cube_meta
        else:
            return Cube(name=cube_meta['name'],
                            fact=cube_meta['fact'],
                            aggregates=cube_meta['aggregates'],
                            measures=cube_meta['measures'],
                            label=cube_meta['label'],
                            description=cube_meta['description'],
                            dimensions=cube_meta['dimensions'],
                            store=cube_meta['store'],
                            mappings=cube_meta['mappings'],
                            joins=cube_meta['joins'])


    def dimension(self, name, locale=None, templates=[]):
        raise NoSuchDimensionError('No global dimensions in OS', name)

    def list_cubes(self):
        print "doing this fine------------------------------"
        cubes = []
        for dataset in Dataset.all():
            if not len(dataset.mapping):
                continue
            cubes.append({
                #change here too
                'name': dataset.name,
                'label': dataset.name
            })
        return cubes

    def has_cube(self, cube_ref):
        if Dataset.by_name(cube_ref):
            return True

    # def default_metadata(self):
    #     return {}

    # def cube_features(self):
    #     features = {}
    #     # Replace only the actions, as we are not just a simple proxy.
    #     features["actions"] = ["aggregate", "facts", "fact", "cell", "members"]

    #     return features



class OpenSpendingStore(SQLStore):



    related_model_provider = "openspending"

    def model_provider_name(self):
        return self.related_model_provider

    def __init__(self, **options):
        super(OpenSpendingStore, self).__init__(url=SQLALCHEMY_DATABASE_URI, **options)
        options = dict(options)
        self.options = options
        self.options = coalesce_options(options, OPTION_TYPES)
        # self.logger = get_logger()
        self.related_model_provider = self.model_provider_name()
        # #self.schema = None
        # self._metadata = None
        print self.schema

    # @property
    # def connectable(self):
    #     return db.engine
        
    # @property
    # def metadata(self):
    #     if self._metadata is None:
    #         self._metadata = db.MetaData(bind=self.connectable)
    #     return self._metadata

