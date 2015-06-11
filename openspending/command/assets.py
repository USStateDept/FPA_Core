import logging
from openspending.command.util import create_submanager
from openspending.command.util import CommandException

from flask import current_app
from webassets.script import BuildCommand, CommandLineEnvironment


log = logging.getLogger(__name__)

manager = create_submanager(description='Build the static files')


@manager.command
def build(silent = False):
    """ Build the static Files"""
    env = current_app.jinja_env.assets_environment

    cmd = CommandLineEnvironment(env, log)

    directory = env.get_directory()

    mybuild = BuildCommand(cmd)
    mybuild(directory=directory)





