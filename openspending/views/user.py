import colander
import logging
import urllib
from flask import Blueprint, render_template, request, redirect, url_for, jsonify
from flask.ext.login import current_user
from flask import current_app
from openspending.core import db
from openspending.model import Dataview

from openspending.auth import require

blueprint = Blueprint('user', __name__)

@blueprint.route('/user', methods=['GET'])
@blueprint.route('/user/<int:account_id>', methods=['GET'])
def dataloader():
    """ Render the user page. """

    msg = ''
    list = {}
    if current_user.is_authenticated():
      list = Dataview.query.filter_by(account_id=current_user.id).all()
    return render_template('user/user.jade',dataviews=list,message=msg)
    
@blueprint.route('/user/adddv', methods=['POST'])    
def saveData():
    """ save a dv to the current  user """
    if current_user.is_authenticated() and current_user.id:
      """ unquote the js uri encoding """
      title = request.form.get('title')
      description = request.form.get('description')
      viz_hash = request.form.get('viz_settings')
      if not title or not viz_hash:
        return jsonify({"status":"error", "message": "You must provide a title and a visualization"})
      """ re add the #"""
      viz_hash = '#f='+ viz_hash[2:]
      dataviewobj = Dataview.by_user_settings(settings={'hash':viz_hash}, account_id=current_user.id)
      if dataviewobj:
        dataviewobj.title = title
        dataviewobj.description = description
      else:
        newrow = Dataview(dict(settings={'hash':viz_hash}, 
                                account_id=current_user.id,
                                title=title,
                                description=description))      
        db.session.add(newrow)
      db.session.commit()
      return jsonify({"status":"success", "message":"Saved Visualization %s."%title})
    else:
      abort(403)

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