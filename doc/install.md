Installation and Setup
======================


Requirements
------------

* [Python](http://www.python.org/) == [2.7.9](https://www.python.org/ftp/python/2.7.9/python-2.7.9.amd64.msi)
* [pip](https://pypi.python.org/pypi/pip) == [6.1.1](https://pypi.python.org/packages/py2.py3/p/pip/pip-6.1.1-py2.py3-none-any.whl)
* [virtualenv](https://pypi.python.org/pypi/virtualenv) == [12.1.1](https://pypi.python.org/pypi/virtualenv#downloads)  
* [PostgreSQL](http://www.postgres.org/) == [9.3.6](http://www.enterprisedb.com/postgresql-936-installers-win64?ls=Crossover&type=Crossover), [PostGIS](http://postgis.net/) == 2.1.5
* [RabbitMQ](http://www.rabbitmq.com/) == [3.5.1](http://www.rabbitmq.com/releases/rabbitmq-server/v3.5.1/rabbitmq-server-3.5.1.exe)
* [Erlang](http://www.erlang.org/) == [OTP 17.5](http://www.erlang.org/download/otp_win64_17.5.exe)
* [Java](http://www.oracle.com/technetwork/java/javase/overview/index.html) == [JRE 7u79](http://download.oracle.com/otn-pub/java/jdk/7u79-b15/jre-7u79-windows-x64.exe)
* [Apache Solr](http://lucene.apache.org/solr/) == [4.10.4](http://apache.claz.org/lucene/solr/4.10.4/solr-4.10.4.zip) - NOT 5.0
* [Google Refine](https://code.google.com/p/google-refine/) == [2.1](https://google-refine.googlecode.com/files/google-refine-2.1-r2136.zip) - NOT 2.5


Installation
------------

First, check out the source code from the repository, e.g. via git on 
the command line::

    $ git clone https://github.com/USStateDept/FPA_Core.git
    $ cd FPA_Core

We also highly recommend you use a virtualenv_ to isolate the installed 
dependencies from the rest of your system.  This should be done in the repository root directory::

    $ virtualenv ./pyenv --distribute

Now activate the environment. Your prompt will be prefixed with the name of
the environment::

    $ call ./pyenv/Scripts/activate

Ensure that any in shell you use to complete the installation you have run the 
preceding command.

Having the virtualenv set up, you can install OpenSpending and its dependencies.
This should be pretty painless. Just run::

    $ pip install -r requirements.txt -e .

You will need to install psycopg.  Get psycopg2‑2.5.5‑cp27‑none‑win_amd64.whl from 
[http://www.lfd.uci.edu/~gohlke/pythonlibs/#psycopg](http://www.lfd.uci.edu/~gohlke/pythonlibs/#psycopg)::

    $ pip install C:\path\to\psycopg2.whl

You may want to use the compiled SQLAlchemy‑1.0.0‑cp27‑none‑win_amd64.whl binary from [http://www.lfd.uci.edu/~gohlke/pythonlibs/#sqlalchemy](http://www.lfd.uci.edu/~gohlke/pythonlibs/#sqlalchemy)
as this includes the C speedups.  Without compiled it will just run pure python.  The speedups will be used in production.

    $ pip install C:\path\to\sqlalchemy.whl

Create a database if you do not have one already. We recommend using Postgres
but you can use anything compatible with SQLAlchemy. For Postgres you would do::

    $ createdb -E utf-8 -U {your-database-user} openspending

Having done that, you can copy configuration templates::

    $ copy settings.py_tmpl settings.py

Edit the configuration files to make sure you're pointing to a valid database 
URL is set::

    # TCP
    SQLALCHEMY_DATABASE_URI = 'postgresql://{user}:{pass}@localhost/openspending'

Additionally to the core repository, you will need to install submodules for the static components::
    
    $ git config --global url.https://github.com/.insteadOf git://github.com/
    $ git submodule init
    $ git submodule update

Then you can install the requirements of the static packages (cloned to .\openspending\static\) and build them by running the following::

    $ static_reqs.bat
    $ staticbuild.bat

These two batch files alleviate the need to install the submodule repos independently.

Edit settings.py to point to the Open Refine server::

    OPENREFINE_SERVER = 'http://127.0.0.1:3333'

Run google-refine.exe

The ```OPENSPENDING_SETTINGS``` environment variable is used to point to the 
settings file.  To ensure that it is always set to the directory you are working
on, you should use setenv.bat or use the runservers.bat file before work.

Run to set your environment variable::

    $ setenv.bat

Initialize the database::

    $ ostool db init

Load the Geometry Entries.  This will be required for a lot of the functionality
using country level indicators::

    - Use the "Restore" feature in pgadmin and load the fixtures/geometry_file.backup

You can now run the "runservers.bat" batch file in the root folder or do the following::

Run the application::

    $ ostool runserver

In order to use web-based importing and loading, you will need to set up
the celery-based background daemon. When running this, make sure to have an
instance of RabbitMQ installed and running and then execute::

    $ celery -A openspending.tasks worker -l info


Setup Solr
----------

Create a configuration home directory to use with Solr. This is most easily 
done by copying the Solr example configuration from the `Solr tarball`_, and 
replacing the default schema with one from OpenSpending.::

    $ copy solr-<version>/* ./solr
    $ copy <full path to openspending>/solr/schema.xml ./solr/example/solr/collection1/conf/
    
Edit ./solr/example/solr/collection1/core.properties to say::

    name=openspending

Start Solr with the full path to the folder as a parameter::

    $ cd .\solr
    $ java -Dsolr.velocity.enabled=false -jar start.jar


Create Admin User
----------

Set up admin account by running the following with your virtualenv activated::

    $ ostool user createuser
    

Test accessibility
----------

You should now be able to navigate to the [home page](http://localhost:5000) and [admin page](http://localhost:5000/admin/) using a browser.
