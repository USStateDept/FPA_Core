

import dataset

db = dataset.connect('****INSERT URI******')

geomtable = db['geometry__country_level0']


yearrange = range(1960,2050)

timetable = db['geometry__time']

import sys


count = 1
for row in geomtable.all():
    print "starting", row.get('label')
    gid = row.get('gid', None)
    if not gid:
        print "BROKEN!"
        sys.exit(1)
    #gid
    for year in yearrange:
        timetable.upsert(dict(id=count, time=year, gid=gid), ['time', 'gid'])
        count += 1


# table.insert(dict(name='John Doe', age=37))
# table.insert(dict(name='Jane Doe', age=34, gender='female'))

# john = table.find_one(name='John Doe')