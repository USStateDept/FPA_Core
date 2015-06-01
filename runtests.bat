set OPENSPENDING_SETTINGS=%CD%\test_settings.py

set /p PGPASSWORD="Postgres password: "

"C:\Program Files\PostgreSQL\9.3\bin\createdb.exe" -U postgres openspending_testing
"C:\Program Files\PostgreSQL\9.3\bin\psql.exe" -d openspending_testing -U postgres -c "create extension postgis;"

"C:\Program Files\PostgreSQL\9.3\bin\pg_restore.exe" -d openspending_testing -U postgres < .\fixtures\geometry_final.backup

REM call "pyenv/Scripts/activate.bat"

nosetests openspending.tests.views.test_account
nosetests openspending.tests.model.test_country

"C:\Program Files\PostgreSQL\9.3\bin\dropdb.exe" -U postgres -W openspending_testing

