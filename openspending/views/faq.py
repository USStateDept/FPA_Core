import colander
import logging
import urllib
from flask import Blueprint, render_template, request, redirect, url_for
from flask.ext.login import current_user
from flask import current_app

blueprint = Blueprint('faq', __name__)

@blueprint.route('/faq', methods=['GET'])
def index():
    """ Render the user page page. """
    return render_template('faq/faq.jade')