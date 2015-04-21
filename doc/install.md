Installation and Setup
======================


Requirements
------------

* [Python](http://www.python.org/) == 2.7, with [pip](http://pypi.python.org/pypi/pip) and [virtualenv](http://pypi.python.org/pypi/virtualenv)  
* [PostgreSQL](http://www.postgres.org/) == 9.3, PostGIS >= 2.0
* [RabbitMQ](http://www.rabbitmq.com/) >= latest
* [Erlang](http://www.erlang.org/download.html) >= latest
* [Java](http://www.oracle.com/technetwork/java/javase/downloads/index.html) == 1.7
* [`Apache Solr`](http://lucene.apache.org/solr/) = 4.x - NOT 5.0
* [GoogleRefine](https://code.google.com/p/google-refine/downloads/list?can=1) = 2.1 - NOT latest


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
the environment.::

    $ source ./pyenv/Scripts/activate

Ensure that any in shell you use to complete the installation you have run the 
preceding command.

Having the virtualenv set up, you can install OpenSpending and its dependencies.
This should be pretty painless. Just run::

    $ pip install -r requirements.txt -e .


You will need to install psycopg.  Get the wheel from 
http://www.lfd.uci.edu/~gohlke/pythonlibs/#psycopg::

    $ pip install C:\path\to\psycopg2.whl

You may want to use the compiled binaries form http://www.lfd.uci.edu/~gohlke/pythonlibs/#sqlalchemy
as this includes the C speedups.  Without compiled it will just run pure python.  The speedups will be used in production.

    $ pip install C:\path\to\sqlalchemy.whl

Create a database if you do not have one already. We recommend using Postgres
but you can use anything compatible with SQLAlchemy. For postgres you would do::

    $ createdb -E utf-8 -U {your-database-user} openspending

Having done that, you can copy configuration templates::

    $ copy settings.py_tmpl settings.py

Edit the configuration files to make sure you're pointing to a valid database 
URL is set::

    # TCP
    SQLALCHEMY_DATABASE_URI = 'postgresql://{user}:{pass}@localhost/openspending'


Additionally to the core repository, you will need to install submodules for that static components::
    
    $ git config --global url.https://github.com/.insteadOf git://github.com/
    $ git submodule init
    $ git submodule update

Then you can install the requirements of the static packages and build them by running the following::

    $ static_reqs.bat
    $ staticbuild.bat


The ```OPENSPENDING_SETTINGS``` environment variable is used to point to the 
settings file.  To ensure that it is always set to the directory you are working
on, you should use setenv.bat or use the runservers.bat file before work.

Run to set your environment variable::

    $ setenv.bat

Initialize the database::

    $ ostool db init


Load the Geometry Entries.  This will be required for a lot of the functionality
using country level indicators.  There are two options::

    - Use the "Restore" feature in pgadmin and load the fixutres/geometry_file.backup

    - Use psql to load the fixtures/geometry_file.sql file using the command line.
    


You can now run the "runservers.bat" batch file in the root folder or do the following::


Run the application::

    $ ostool runserver

In order to use web-based importing and loading, you will also need to set up
the celery-based background daemon. When running this, make sure to have an
instance of RabbitMQ installed and running and then execute::

    $ celery -A openspending.tasks worker -l info


Setup Solr
----------

Create a configuration home directory to use with Solr. This is most easily 
done by copying the Solr example configuration from the `Solr tarball`_, and 
replacing the default schema with one from OpenSpending.::

    $ copy apache-solr-<version>/* C:/solr
    $ copy <full path to openspending>/solr/schema.xml ./solr/example/solr/collection1/conf/
    
    edit ./solr/example/solr/collection1/core.properties to say name=openspending

Start Solr with the full path to the folder as a parameter: ::

    $ cd C:\solr
    $ java -Dsolr.velocity.enabled=false -jar start.jar


Set up admin account by running the following with your virtualenv activated
    $ ostool createuser

