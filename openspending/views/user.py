import colander
import logging
from flask import Blueprint, render_template, request, redirect, url_for
from flask.ext.login import current_user
from flask import current_app
from openspending.core import db
from openspending.model import Dataview

from openspending.auth import require

blueprint = Blueprint('user', __name__)

@blueprint.route('/user', methods=['GET'])
def dataloader():
    """ Render the user page page. """
    msg = ''
    list = Dataview.query.filter_by(account_id=current_user.id).all()
    return render_template('user/user.jade',dataviews=list,message=msg)
    
@blueprint.route('/user/adddv', methods=['GET'])    
def saveData():
    """ save a dv to the current  user """
    if current_user.id:
      newrow = Dataview({'title':'Test','description':'This is a test','account_id':current_user.id})
      db.session.add(newrow)
      db.session.commit()
      msg = 'Saved visualization'
    else:
      msg = 'You must be logged in'    
    return redirect("/user")

@blueprint.route('/user/removedv/<int:targetid>', methods=['GET'])    
def deleteData(targetid):
    """ delete a dv if the current user is the owner in the table """
    target = Dataview.query.get(targetid)
    if target and current_user.id == target.account_id:
      db.session.delete(target)
      db.session.commit()
      msg = 'Deleted the dataview'
    else:
      msg = 'Couldn\'t find that dataview to delete'
    return redirect("/user")