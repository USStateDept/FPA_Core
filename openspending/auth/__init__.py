import inspect
from werkzeug.exceptions import Forbidden

# These have to be imported for the permission system to work
import account  # NOQA
import dataset  # NOQA
from flask import abort
from functools import wraps
from flask.ext.login import current_user

from openspending.auth.perms import is_authenticated, is_moderator, is_admin

def admin_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if not is_admin(current_user):
            abort(403)
        else:
            return f(*args, **kwargs)
    return decorated


def moderator_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if not is_moderator(current_user):
            abort(403)
        else:
            return f(*args, **kwargs)
    return decorated

def authenticated_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if not is_authenticated(current_user):
            abort(403)
        else:
            return f(*args, **kwargs)
    return decorated



class Requirement(object):

    """ Checks a function call and raises an exception if the
    function returns a non-True value. """

    def __init__(self, wrapped):
        self.wrapped = wrapped

    def __getattr__(self, attr):
        real = getattr(self.wrapped, attr)
        return Requirement(real)

    def __call__(self, *args, **kwargs):
        fc = self.wrapped(*args, **kwargs)
        if fc is not True:
            raise Forbidden('Sorry, you\'re not permitted to do this.')
        return fc

    @classmethod
    def here(cls):
        module = inspect.getmodule(cls)
        return cls(module)

require = Requirement.here()
