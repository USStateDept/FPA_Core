from openspending.command.util import create_submanager
from openspending.command.util import CommandException

from flask import current_app
import flask_whooshalchemy as whoo
from openspending.command.geometry import create as createCountries

manager = create_submanager(description='User operations')


@manager.command
def reindex():
    """ Grant admin privileges to given user """
    from openspending.core import db
    from openspending.model import Dataset
    from openspending.model.country import Country

    index = whoo.whoosh_index(current_app, Dataset)

    with index.writer() as writer:

        for dataset in Dataset.all():
            primary_field = dataset.pure_whoosh.primary_key_name
            searchable = dataset.__searchable__
            attrs = {}
            for key in searchable:
                try:
                    attrs[key] = unicode(getattr(dataset, key))
                except AttributeError:
                    raise AttributeError('{0} does not have {1} field {2}'
                            .format("Dataset", __searchable__, key))

                attrs[primary_field] = unicode(getattr(dataset, primary_field))
                writer.update_document(**attrs)

    index = whoo.whoosh_index(current_app, Country)
    with index.writer() as writer:

        #make sure we ahve all of the geometry tables in there
        createCountries(silent=True)

        for country in Country.all():
            primary_field = country.pure_whoosh.primary_key_name
            searchable = country.__searchable__
            attrs = {}
            for key in searchable:
                try:
                    attrs[key] = unicode(getattr(country, key))
                except AttributeError:
                    raise AttributeError('{0} does not have {1} field {2}'
                            .format("Country", __searchable__, key))

                attrs[primary_field] = unicode(getattr(country, primary_field))
                writer.update_document(**attrs)


