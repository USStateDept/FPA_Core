Data Loading Process
======================

Note
---------------

This is only to be run one time to maintain the integrity of the loaded data.  Check to see how data is overwritten in the command code loadmetajsononly and test on the current database before proceeding.

Requirements
------------

* Full install including geography tables in working DB
* Running server, celery, solr, and openrefine

Process
-------------

1. Go to Django databank.edip-maps.net server on AWS

2. Enable the virtualenv in D:\databank

3. Run the following to get a dump of the data

    $ python manage.py dumpdata > C:\path\to\desktop\djangodata_date.json

4. Copy all of the uploads files and zip to be transfered

5. Load all of these files on the computer that you're working with

6. From command line with virtualenv enabled, run

    $ ostool loadmetaonlyjson -f C:\path\to\unzipped\uploads\files\ C:\path\to\djangodata_date.json

7. Once this has run, go to http://__domain__/static/dataloader/build/index.html

8. Click edit data and add the appropriate settings

9. If loaded correctly, then mark the indicator as loaded in the databank.edip-maps.net site.
