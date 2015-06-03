Moving from Development to Production
===================================

5/29/2015

Moving the code from the repo to the server.  Please read change_notes_MVPv1_to_MVPv2.md to be familiar with major changes.

Before doing anything, it would be best to snapshots of the volumes of the instances that will be updated.


Backend
-----------------------------

1. Log in to FINDApp1

2. Do a full backup dump of the database to a file

3. Go to services and stop the apache service.  

4. Open a command line and go to D:\FPA_Core\

5. Pull in the latest code - take note of the move from MVPv1 to MVPv2, you must remove the submodules.  See change_notes_MVPv1_to_MVPv2.md

6. Run the follow commands to pull in any changes to the python modules, update the database, and reindex for the search.  Note there is no virtualenv.  Everything is installed in the core Python install.

```

$ pip install -r requirements.txt

$ ostool db migrate

$ ostool search reindex

```

7. Go back to services and start the apache server


Front-end
----------------------

1. Copy all built files to the AWS bucket findstatic.  CloudFront will cache these files, so it takes an hour or two before it delivers the updated files.

2. Go to cloudfront and invalidate all files that were overwritten in order to update the cache.   For example, invalidate path /static/* (instructions for how to invalidate files http://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/Invalidation.html)
