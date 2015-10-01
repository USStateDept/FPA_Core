[<----- Back to index](../readme.md)

Data API Documentation
=======================

Introduction
----------------------
The data API uses the concepts of OLAP (Online Analytical Processing).  The terms drilldown, cuts, and cubes are related to this topic.  The most recent API is a very slimmed down version of the original cubes library that was used.  See http://cubes.databrewery.org/ for more information on OLAP.

Setup
-----------------------
Any API calls that are versioned 4 or 5 require a flat table structure that is built in the finddata schema.  In order to build these flat tables with data that is already loaded in the database run:

```
$ pip install -r requirements.txt --upgrade
$ ostool db denormalize -d
```

This will create a the new schema, delete and load the new tables.  The tables are denormalized automatically when using the dataloader UI (/findadmin/dataloader).

Usage
-----------------------
The following is an expample of getting "Access to Credit" and "Hyogo Framework" indicators from 1990 to 2015 for four countries and to calculate the breaks in the data using natural jenks method. All data will always be ordered by time.  

```
api/prefix/aggregate?
cluster=jenks&
numclusters=4&
cubes=access_to_credit_strength_of_l|hyogo_framework_for_action_hfa&
cut=geometry__time:1990-2015&
order=time
&drilldown=geometry__country_level0@name|geometry__time
&cut=geometry__country_level0@name:albania;argentina;australia;azerbaijan
```

This is the breakdown of the parameters

 - cubes (attribute, many) **Required**
     - e.g. cubes=cubes1_code|cubes2_code
     - default return error if it does not exist
 - daterange (attribute, range)
     - e.g. daterange=2010-2014 
     - default return 1990-current year
 - format (attribute, one)
     - e.g. format=json
     - default json
     - options json, csv, excel
 - drilldown (drilldown, many)
     - e.g. drilldown=geometry__country_level0@name|geometry__time
     - default aggregate all
     - options geometry__country_leve0@see columns of regions, geometry__time,  
 - cut (dates, countries)
     - e.g. cut=geometry__country_level0@name:somecountrycode1;somecountrycode2
     - default to return all