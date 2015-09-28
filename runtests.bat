set OPENSPENDING_SETTINGS=%CD%\test_settings.py
set PYTHONHOME=
set PYTHONPATH=


call forever start findapi\app.js

set /p PGPASSWORD="Postgres password: "

"C:\Program Files\PostgreSQL\9.3\bin\createdb.exe" -U postgres openspending_testing
"C:\Program Files\PostgreSQL\9.3\bin\psql.exe" -d openspending_testing -U postgres -c "create extension postgis;"

"C:\Program Files\PostgreSQL\9.3\bin\pg_restore.exe" -d openspending_testing -U postgres < .\openspending\tests\fixtures\testing_database.backup

call "pyenv/Scripts/activate.bat"

REM make sure we are using the latest db
ostool db migrate

nosetests 

call forever stopall

"C:\Program Files\PostgreSQL\9.3\bin\dropdb.exe" -U postgres -W openspending_testing

set OPENSPENDING_SETTINGS=%CD%\settings.py

