Sync Production files and database to a Dev Virtual Machine
====================

1.  Log into the Application Server
  - Go to the database using pgadmin and dump the entire database
  - Navigate to the FPACore folder and zip up all of the files in the repository folder in the "datauploads" folder.
  - Transfer files in whatever way is convenient to access from your virtual machine
2. Log into the background server
  - Go to the user profile of openrefineuser\AppData\Roaming\Google
  - Zip up the entire Google Folder.
  - Transfer the zip file in whatever way is convenient to access from your virtual machine
3. Log into your virtual machine
  - Make sure your virtual machine repo is synced with the latest from FPA_Core with the following:
    ```
    git pull origin master
    
    git submodule update
    
    pip install -r requirements -e . --upgrade
    ```
  - Download all three files
  - Open pgadmin
    - Remove or rename your development database
    - Create a new database with the name that is being used by the settings.py file
    - Restore the production database dump.  It should transfer all postgis functions.  If not, run the following SQL command first then restore the database dump:
    
    ```
    CREATE EXTENSION postgis;
    ```
  - Next create or replace all files in the datauploads folder with the downloaded unzipped folder
  - Finally, navigate to your user profile\AppData\Roaming and create or replace the files with the Google unzipped folder.

    
    
    

