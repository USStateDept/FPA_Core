from sqlalchemy import create_engine
import json

engine = create_engine('POSTGRES URI')

SIMPLIFY_VALUES = [None, .1, .01, .001, .0001]

#from postgis columns
REGIONS = ['sovereignt', 'continent', 'dos_region', 
            'usaid_reg', 'dod_cmd', 'feed_the_f', 
            'pepfar', 'paf', 'oecd', 'region_un',
            'subregion', 'region_wb', 'wb_inc_lvl']


def result_to_geojson(result, properties=['label','gid']):
    geojsonreturn = { "type": "FeatureCollection",
                    "features": []
                    }

    for row in result:
        tempobj = { "type": "Feature",
            "geometry": json.loads(row['geom']),
            "properties": {
              }
        }
        for prop in properties:
            tempobj['properties'][prop] = row[prop]
        geojsonreturn['features'].append(tempobj)
    return geojsonreturn




connection = engine.connect()
for simplevalue in SIMPLIFY_VALUES:
    print "doing value", str(simplevalue)
    if simplevalue is None:
        result = connection.execute("""SELECT \
                                    label, gid, ST_AsGeoJson(geom) as geom \
                                    from \
                                    public.geometry__country_level0 as country_level0;""")
    else:
        result = connection.execute("""SELECT \
                                    label, gid, ST_AsGeoJson(ST_SimplifyPreserveTopology(geom, """ + str(simplevalue) + """)) as geom \
                                    from \
                                    public.geometry__country_level0 as country_level0;""")

    geojsonreturn = result_to_geojson(result)

    with open("output/geounit_" + str(simplevalue) + ".geojson", 'wb') as f:
        json.dump(geojsonreturn, f)


    for region in REGIONS:
        print "\tdoing", region
        if simplevalue is None:
            result = connection.execute("""SELECT
                                            """ + region + """, ST_AsGeoJSON(ST_Union(geom)) as geom
                                            FROM 
                                            public.geometry__country_level0 as country_level0
                                            GROUP BY
                                            """ + region + """;""")
        else:
            result = connection.execute("""SELECT
                                            """ + region + """, ST_AsGeoJSON(ST_Union(ST_SimplifyPreserveTopology(geom, """ + str(simplevalue) + """))) as geom
                                            FROM 
                                            public.geometry__country_level0 as country_level0
                                            GROUP BY
                                            """ + region + """;""")

        geojsonreturn = result_to_geojson(result, properties = [region])

        with open("output/" + region + "_" + str(simplevalue) + ".geojson", 'wb') as f:
            json.dump(geojsonreturn, f)     

print "Success"   













connection.close()

import sys
sys.exit()





# output to geojson for by geounit





#output to geojson for each of the regions