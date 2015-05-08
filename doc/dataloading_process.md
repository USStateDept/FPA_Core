Data Loading Process
-----------------------


 1. Open the following in your browser
  - http://finddev.edip-maps.net/admin/run/?sort=4&desc=1 -- Most recent runs.  Each time data is triggered to be loaded, a run will be created.
  - http://finddev.edip-maps.net/admin/logrecord/?sort=5&desc=1 -- Logs will be generated one per error.  All are related to the run model object
  - http://finddev.edip-maps.net/static/dataloader/build/index.html#/datasetlist -- Data loading application
 2. In the data loading application, click edit data.  There may be the following statuses for each dataset
  - Mapping data required -- There is no column mapping or OpenRefine Functions available.  Data is not available
  - Attempted Load with few errors -- This will be a typical status, since no data loading process has the exact perfect data.
  - Successfully loaded -- Probably will not see this.
 3. After you click edit data, click the OpenRefine link under "ORStuff".
  - This will open the google refine application.  Make all transformation necessary including the following:
    - One column should have the country code or country name (country code is better)
    - One column should have the value to be loaded (currently only float values are supported).  Blank data cells will throw an error
    - One column should have a date format.  YYYY (e.g. 1994) seems to work pretty well.  
 4. After all the data looks good in the OpenRefine Application, close the browser window.  Your work will persist in OpenRefine.  
 5. Back on the data loading application, under the "Model Stuff" select the differnt columns in the dropdowns that correspond to the header of the fieldset.
 6. Click Submit Model (Currently this will probably timeout at 47 seconds.  See steps below to monitor progress.
 7. Go to the first URL opened in the browser listing the Runs of the system.  You should see the top entry should be your dataset.  It will either say "running" or "fail" or "success". The status failed just means that there was at least one error in the dataloading.  Same as above no data is exactly perfect.
 8. Reload the Runs list until the status changes from "Running" to "failed" or "success", then click over the the next browser window of the log records. 
  - This will list all of the errors from the data load corresponding to the Run object. You might see the following errors:
    - Found X entries, but only loaded X records.  -- Says that some of the rows did not have a valid country (World bank includes some rows that are not countries).
    - Cannot convert to float -- The value of the row was probably blank or might have another character.  Revist the OpenRefine application and verify there are not blanks or special chars in the value column.
 9. You can verify the data loaded correctly by navigating to here replacing "name of dataset" http://finddev.edip-maps.net/api/slicer/cube/geometry/cubes_aggregate?cubes=<< name of dataset >> &drilldown=geometry__country_level0@name
 10. Finally, back on the datasetlist (http://finddev.edip-maps.net/static/dataloader/build/index.html#/datasetlist ), find the link to the django admin site, and mark the indicator as "Complete - FINAL" Status
