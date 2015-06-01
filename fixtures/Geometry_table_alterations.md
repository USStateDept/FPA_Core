Alterations to the Geometry Table
=================


May 21 
----------------

Shows India is an invalid geometry

```
SELECT
ST_IsValidReason(geom) as isvalid, label, gid, ST_IsValidReason(ST_Buffer(geom,0))
from
public.geometry__country_level0 as country_level0
WHERE 
gid=248
```

Replace geom of india with valid 0 buffer geom creator

```
UPDATE geometry__country_level0
SET geom = ST_Multi(ST_Buffer(geom, 0))
WHERE
gid=248
```