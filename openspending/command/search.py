from openspending.command.util import create_submanager
from openspending.command.util import CommandException

from flask import current_app
import flask_whooshalchemy as whoo

manager = create_submanager(description='User operations')


@manager.command
def reindex():
    """ Grant admin privileges to given user """
    from openspending.core import db
    from openspending.model import Dataset

    index = whoo.whoosh_index(current_app, Dataset)

    with index.writer() as writer:

        for dataset in Dataset.all():
            print "working on ", dataset
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

