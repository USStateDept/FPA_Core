from cubes.providers import ModelProvider
from cubes.model import Cube, Measure, MeasureAggregate, create_dimension
from cubes.backends.sql.store import SQLStore, OPTION_TYPES
from cubes.errors import NoSuchCubeError, NoSuchDimensionError
from cubes.common import coalesce_options
from cubes.logging import get_logger

from openspending.core import db
from openspending.model import Dataset


def sort_on_deps(joinslist, detail_table):
    joinslist = joinslist[::-1]
    #find the instance of this detail table in master and move it to the top
    theindex = -1
    for j in range(len(joinslist)):
        if joinslist[j]['detail'].split(".")[0] == detail_table:
            theindex = j
            continue
    keyjoin = {'master': joinslist[theindex]['detail'], 'detail':joinslist[theindex]['master']}
    joinslist.pop(theindex)
    joinslist.insert(0, keyjoin)
    return joinslist

def add_table_identifier(meta_items, name, seperator="~"):
    for dim in meta_items:
        dim.name = name + seperator + dim.name
        try:
            dim.ref = name + seperator + dim.ref
        except:
            pass
        try:
            dim.measure = name + seperator + dim.measure
        except:
            pass
    return meta_items


def coalesce_cubes(master_meta, detail_meta):
    #ugh... cubes has used every special character, so when we try to push together the 
    #cube name and the aggregates/measures/dimensions name it reads it as a special char to be processed.

    for item in ['aggregates', 'measures', 'dimensions']:
        master_meta[item] = add_table_identifier(master_meta[item], master_meta['name']) + \
                                    add_table_identifier(detail_meta[item], detail_meta['name'])


    master_meta_new = {}
    for mapkey in master_meta['mappings'].keys():
        master_meta_new[master_meta['name'] + "~" + mapkey] = master_meta['mappings'][mapkey]
    for mapkey in detail_meta['mappings']:
       master_meta_new[detail_meta['name'] + "~" + mapkey] = detail_meta['mappings'][mapkey]
    master_meta['mappings'] = master_meta_new
    #don't forget the actual amounts
    master_meta['mappings'][master_meta['name'] + '~amount'] = master_meta['name'] + '__entry.amount'
    master_meta['mappings'][detail_meta['name'] + '~amount'] = detail_meta['name'] + '__entry.amount'

    master_meta['mappings'].update(detail_meta['mappings'])
    master_meta['joins']  = master_meta['joins'] + \
        [{"master": "test_geom__Country_level0.label", "detail":"geometry__country_level0.label"}] + \
        sort_on_deps(detail_meta['joins'], "geometry__country_level0") #need to make sure the one being joined comes last

    master_meta['joins'] = master_meta['joins'][::-1]

    return master_meta




class OpenSpendingModelProvider(ModelProvider):
    __extension_name__ = 'openspending'

    def __init__(self, *args, **kwargs):

        #using individual merges over using a global dimensions.  Not sure this is the best path.

        # #let's prep some globals here
        # mydim = create_dimension(
        #             {
        #              "name":"mygeom",
        #                 "levels": [
        #                     { "name": "geom_id",
        #                       "attributes": [ "geom_id",
        #                                       {"name": "country_level0"}
        #                                     ]
        #                     }
        #                 ]

        #             }
        #         )

        # geom = Cube(name="geometry",
        #             fact="geometry",
        #             aggregates=[
        #                             MeasureAggregate("amount_sum",
        #                                                  label="amount_sum",
        #                                                  measure="amount",
        #                                                  function='sum'),
        #                             MeasureAggregate("record_count",
        #                                                  function='count')
        #                         ],
        #             measures=[Measure("amount", label="Amount")],
        #             label="geometry",
        #             description="core going here",
        #             dimensions=[mydim],
        #             #store=self.store,
        #             mappings={
        #                   "mygeom.country_level0": "geometry__country_level0.label",
        #                   "mygeom.geom_id" : "geometry__country_level0.id"
        #                  },
        #             joins=[
        #                     {"master": "geometry__entry.country_level0_id", "detail":"geometry__country_level0.id"}
        #                 ])
        # self.globalcubes = [geom]
        # self.globaldims = [mydim]
        # metadata = {'cubes':[geom.to_dict()],'dimensions':[mydim.to_dict()]}
        super(OpenSpendingModelProvider, self).__init__(*args, **kwargs)

    def requires_store(self):
        return True

    def cube(self, name, locale=None, joiner=False):
        dataset = Dataset.by_name(name)
        if name is None:
            raise NoSuchCubeError("Unknown dataset %s" % name, name)

        mappings = {}
        joins = []
        fact_table = dataset.model.table.name

        aggregates = [MeasureAggregate('num_entries',
                                       label='Numer of entries',
                                       function='count')]
        measures = []
        for measure in dataset.model.measures:
            cubes_measure = Measure(measure.name, label=measure.label)
            measures.append(cubes_measure)
            aggregate = MeasureAggregate(measure.name,
                                         label=measure.label,
                                         measure=measure.name,
                                         function='sum')
            aggregates.append(aggregate)

        dimensions = []
        for dim in dataset.model.dimensions:
            meta = dim.to_cubes(mappings, joins)
            meta.update({'name': dim.name, 'label': dim.label})
            dimensions.append(create_dimension(meta))


        cube_meta = {"name":dataset.name,
                                "fact":fact_table,
                                "aggregates":aggregates,
                                "measures":measures,
                                "label":dataset.label,
                                "description":dataset.description,
                                "dimensions":dimensions,
                                "store":self.store,
                                "mappings":mappings,
                                "joins":joins}

        if not joiner:
            #get this name from a data view
            join_meta  = self.cube("geometry", joiner=True)
            cube_meta = coalesce_cubes(cube_meta, join_meta)
        else:
            return cube_meta


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
        for dataset in Dataset.all_by_account(None):
            if not len(dataset.mapping):
                continue
            cubes.append({
                'name': dataset.name,
                'label': dataset.label
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
