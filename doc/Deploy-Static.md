Prerequisite
============
Install Cloudberry

Have credentials to access AWS S3

Add the S3 bucket in Cloudberry

Paths
=====
The static applications are in the folder FPA_Core/openspending/static

The main front-end application is in the folder find-ui

Within find-ui, dist and bower_components are the only folders are should be copied over

Suggestions
===========
Identify which folder will need to be copied. 

Copying bower_components is time consuming, so if a folder was adder to bower_components, only copy over that folder

dist is a small folder so it is ok to copy dist if even a single file has changed.

Deployment Procedure
====================
Copy the target folder over to the S3 bucket

Right click on that folder and select ACL Settings

Give Read permission to All Users and Check the Apply for all Subfolders option, click OK

Login to aws.amazon.com using your credentials

Click on CloudFront

Click on the ID of the Distribution

Click on Invalidations tab

CLick Create Invalidation

Type in the folder (look at a previous one for assistance)

Typically this may take 40 minutes


