from openspending.command.util import create_submanager
from openspending.command.util import CommandException

manager = create_submanager(description='User operations')


@manager.command
#@manager.option('username')
def grantadmin(username):
    """ Grant admin privileges to given user """
    from openspending.core import db
    from openspending.model import Account

    a = Account.by_name(username)

    if a is None:
        raise CommandException("Account `%s` not found." % username)

    a.admin = True
    db.session.add(a)
    db.session.commit()



@manager.command
def createuser():
    """ Create a new user """
    from openspending.core import db
    from openspending.model import Account
    import sys
    import getpass
    from werkzeug.security import check_password_hash, generate_password_hash



    account = Account()
    account.fullname  = raw_input("User Full name: ")
    account.email  = raw_input("User email: ")
    if Account.by_email(account.email):
        raise CommandException("Account `%s` already exists." % account.email)
    pass1 = getpass.getpass("Password: ")
    pass2 = getpass.getpass("Password again: ")
    if pass1 != pass2:
        print "passwords do not match"
        sys.exit()
    account.password = generate_password_hash(pass1)
    isadmin = raw_input("User is admin (leave blank for no): ")
    if not isadmin:
        account.admin = False
    else:
        account.admin = True
    account.verified = True
    db.session.add(account)
    db.session.commit()
