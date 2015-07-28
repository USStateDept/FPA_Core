import colander
import logging
import urllib
from flask import Blueprint, render_template, request, redirect, url_for
from flask.ext.login import current_user
from flask import current_app

from openspending.auth import require

blueprint = Blueprint('faq', __name__)

@blueprint.route('/faq', methods=['GET'])
def dataloader():
    """ Render the user page page. """
    return render_template('faq/faq.jade')