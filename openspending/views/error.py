from functools import wraps

from werkzeug.exceptions import HTTPException
from flask import request, render_template, Response

from openspending.lib.jsonexport import jsonify
from flask import current_app, redirect
from flask.ext.login import current_user
from openspending.lib.helpers import flash_notice
from openspending.auth.perms import is_authenticated
from openspending.lib.helpers import url_for


def api_json_errors(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        request._return_json = True
        return f(*args, **kwargs)
    return decorated_function

def handle_error(exc):
    status = 500
    title = exc.__class__.__name__
    message = unicode(exc)
    headers = {}
    if isinstance(exc, HTTPException):
        message = exc.get_description(request.environ)
        message = message.replace('<p>', '').replace('</p>', '')
        status = exc.code
        title = exc.name
        headers = exc.get_headers(request.environ)
    html = render_template('error.jade', message=message,
                           title=title, status=status)
    return Response(html, status=status, headers=headers)

def login_redirect(e):

    nextpath = request.environ.get("PATH_INFO", "/")
    if is_authenticated(current_user):
        flash_notice("This feature is only for administrators")
        return redirect(url_for('home.index'))
    else:
        flash_notice("You are not permitted to use this feature.")
        return redirect(url_for('account.login', next=nextpath))
