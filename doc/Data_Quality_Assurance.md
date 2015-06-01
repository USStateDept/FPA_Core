Data Loading Quality Assurance
==================

1. Start the development server on localhost:5000 (Activate virtualenv if necessary)
2. Open a new command window and run the following to put a zip file of indicator data info

```

$ ostool output_logs -f C:\path\to\a\folder\

```

The output file will have all of the log records of the last data load, the output from OpenRefine before the data load, and a time/geometry drilldown of the dataset.
