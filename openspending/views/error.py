from functools import wraps

from werkzeug.exceptions import HTTPException
from flask import request, render_template, Response

from openspending.lib.jsonexport import jsonify


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
