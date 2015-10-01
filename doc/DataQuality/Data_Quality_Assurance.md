[<----- Back to index](../readme.md)



Data Loading Quality Assurance
==================

1. Start the development server on localhost:5000 (Activate virtualenv if necessary)
2. Open a new command window and run the following to put a zip file of indicator data info

```

$ ostool output_logs -f C:\path\to\a\folder\

```

The output file will have all of the log records of the last data load, the output from OpenRefine before the data load, and a time/geometry drilldown of the dataset.



**You can also check the missed countries by using the following**

This will print a CSV with all of the countries that did not match in the data loading process.  You can update the geometry__alt_names table with the new names that match the gid of the geometry__country_level0 table.

```

$ ostool shell

>> from openspending.admin.helpers import check_countries;z=check_countries()
>> f = open('path/to/where/you/want/to/save.csv', 'wb')
>> f.write(z)
>> f.close()
>> exit()


```
