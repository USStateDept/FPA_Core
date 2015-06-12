''' Interface to common administrative tasks for OpenSpending. '''
import logging
from flask.ext.script import Manager
#from flask.ext.assets import ManageAssets

from openspending.core import create_web_app
from openspending.command import user, db, importer, dbimport, search, geometry, assets

log = logging.getLogger(__name__.split('.')[0])

app = create_web_app()

with app.app_context():

  manager = Manager(app, description=__doc__)

  manager.add_option('-v', '--verbose',
                     dest='verbose', action='append_const', const=1,
                     help='Increase the logging level')
  manager.add_option('-q', '--quiet',
                     dest='verbose', action='append_const', const=-1,
                     help='Decrease the logging level')

  manager.add_command('user', user.manager)
  manager.add_command('search', search.manager)
  manager.add_command('geometry', geometry.manager)
  manager.add_command('db', db.manager)
  manager.add_command('assets', assets.manager)
  #app.jinja_env.assets_environment.environment = app.jinja_env.assets_environment
  #manager.add_command('assets', ManageAssets(app.jinja_env.assets_environment))

  importer.add_import_commands(manager)

  dbimport.add_import_commands(manager)


def main():
    manager.set_defaults()
    parser = manager.create_parser('ostool')
    args = parser.parse_args()
    args.verbose = 0 if args.verbose is None else sum(args.verbose)
    log.setLevel(max(10, log.getEffectiveLevel() - 10 * args.verbose))

    manager.run()

if __name__ == "__main__":
    main()
