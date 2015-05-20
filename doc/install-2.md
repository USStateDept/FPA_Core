**This needs to be formatted better***

Download Sublime and install
Install Package Control - https://packagecontrol.io/installation

Download Git
http://git-scm.com/download/win

Download Total Commander and install

Download Python and install
Select PIP during install, select Add Python Path
If PIP doesnt install then install from here
https://pip.pypa.io/en/latest/installing.html


Install Virtualenv by command pip install virtualenv

Install PostGres
http://www.enterprisedb.com/postgresql-936-installers-win64?ls=Crossover&type=Crossover
Make sure to select StackBuilder at end
PostGIS 2.1.5
create username password postgres/postgres
Dont create spatial database at end

Install ERLang

Install RabbitMQ

Install Java

Unzip openrefine in c:\apps\openrefine

git clone https://github.com/USStateDept/FPA_Core.git
cd FPA_Core

virtualenv ./pyenv --distribute

cd pyenv/Scripts
activate
cd..
cd.. (go back to FPA_Core root)

Now install OpenSpending
pip install -r requirements.txt -e .

download psycopg2 from here (PostSQL Adapter for Python)
http://www.lfd.uci.edu/~gohlke/pythonlibs/r7to5k3j/psycopg2-2.5.5-cp27-none-win_amd64.whl
Install
pip install C:\downloads\psycopg2-2.5.5-cp27-none-win_amd64.whl

Get the compiled SQLAlchemy-1.0.0-cp27-none-win-amd64
http://www.lfd.uci.edu/~gohlke/pythonlibs/r7to5k3j/SQLAlchemy-1.0.4-cp27-none-win_amd64.wh
pip install C:\downloads\SQLAlchemy-1.0.4-cp27-none-win_amd64.whl


Go to cmd folder c:\Program FIles\PostgresSQL\9.3\bin
createdb -E utf-8 -U postgres openspending

Go to FPACore root cmd
copy settings.py_tmpl settings.py
Edit settings.py line
SQLALCHEMY_DATABASE_URI = 'postgresql://postgres:postgres@localhost/openspending'
OPENREFINE_SERVER = 'http://127.0.0.1:3333'


Install Node.js
http://nodejs.org/dist/v0.12.3/x64/node-v0.12.3-x64.msi

From FPACore run these
$ static_reqs.bat
$ staticbuild.bat

to set environment variable OPENSPENDING_SETTINGS
$ setenv.bat
$ ostool db init (its ok to see errors here)

Use the "Restore" feature in pgadmin and load the fixtures/geometry_file.backup

$ ostool runserver

Test with http://localhost:5000/

For webbased importing and loading
celery -A openspending.tasks worker -l info

$ ostool user createuser
This will create a user whose email is used for username

test http://localhost:5000/admin and login

=================================

When starting the system fresh do this
1. Run openrefine.exe
2. pyenv.bat from commandline
3. runservers.bat
