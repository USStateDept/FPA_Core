from cubes.providers import ModelProvider
from cubes.model import Cube, Measure, MeasureAggregate, create_dimension
from cubes.backends.sql.store import SQLStore, OPTION_TYPES
from cubes.errors import NoSuchCubeError, NoSuchDimensionError
from cubes.common import coalesce_options
from cubes.logging import get_logger

from openspending.core import db
from openspending.model import Dataset, Source
from openspending.lib.helpers import get_source

from openspending.lib.cubes_util import getGeomCube



class OpenSpendingModelProvider(ModelProvider):
    __extension_name__ = 'openspending'

    def __init__(self, *args, **kwargs):
        super(OpenSpendingModelProvider, self).__init__(*args, **kwargs)

    def requires_store(self):
        return True


    def cube(self, name, locale=None, metaonly = False):

        if name == "geometry":
            return getGeomCube(self, metaonly)

        source = get_source(name)
        if name is None:
            raise NoSuchCubeError("Unknown dataset %s" % name, name)



        mappings = {}
        joins = []
        fact_table = source.model.table.name

        aggregates = [MeasureAggregate('num_entries',
                                       label='Numer of entries',
                                       function='count')]
        measures = []
        for measure in source.model.measures:
            cubes_measure = Measure(measure.name, label=measure.label)
            measures.append(cubes_measure)
            aggregate = MeasureAggregate(measure.name,
                                         label=measure.label,
                                         measure=measure.name,
                                         function='sum')
            aggregates.append(aggregate)

        dimensions = []
        for dim in source.model.dimensions:
            meta = dim.to_cubes(mappings, joins)
            meta.update({'name': dim.name, 'label': dim.label})
            dimensions.append(create_dimension(meta))



        cube_meta = {"name":source.name,
                                "fact":fact_table,
                                "aggregates":aggregates,
                                "measures":measures,
                                #change these when they get addeed to the model
                                "label":source.name,
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
        cubes = []
        for source in Source.all():
            if not len(source.mapping):
                continue
            cubes.append({
                'name': source.name,
                'label': source.label
            })
        return cubes


class OpenSpendingStore(SQLStore):
    related_model_provider = "openspending"

    def model_provider_name(self):
        return self.related_model_provider

    def __init__(self, **options):
        super(SQLStore, self).__init__(**options)
        options = dict(options)
        self.options = coalesce_options(options, OPTION_TYPES)
        self.logger = get_logger()
        self.schema = None
        self._metadata = None

    @property
    def connectable(self):
        return db.engine
        
    @property
    def metadata(self):
        if self._metadata is None:
            self._metadata = db.MetaData(bind=self.connectable)
        return self._metadata
