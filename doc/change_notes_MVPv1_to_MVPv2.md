Migrations notes from [MVP v.01](https://github.com/USStateDept/FPA_Core/releases/tag/v0.1) to MVP v.01
======================================

Update Python Modules
---------------------

cubes might not upgrade itself by simply running pip install -r requirements.txt.  You should first run pip uninstall cubes, then run pip install -r requirements.txt to get the latest version.


Submodules
---------------------

Submodules were removed from from the v1 to the v2.  I suggest that the contents dataviewer, dataloader, and viz folders are deleted.  Then you must remove them from the cache of the repository by running git rm --cached /path/to/folder.  You then should be able to pull in the new code.

Geometry Table Change
---------------------

First delete the three following tables ::

 - geometry__time
 - geometry__country_level0
 - geometry__alt_names

Then restore the geometry_final.backup from the fixtures folder to the database.

