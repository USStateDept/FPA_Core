

#from flask.ext.superadmin.model.backends.sqlalchemy import ModelAdmin
#from flask.ext.superadmin.model.base import BaseModelAdmin
from flask.ext import wtf
from flask_admin.contrib import sqla
from flask.ext.admin.contrib.sqla.view import func
from wtforms.fields import StringField, PasswordField, BooleanField, SelectField, TextAreaField
from wtforms.validators import DataRequired, ValidationError
from flask import flash, current_app
import flask_admin as admin
from flask_admin import form, AdminIndexView,expose, BaseView

from flask_admin.model.form import InlineFormAdmin
from flask_admin.contrib.sqla.form import InlineModelConverter
from flask_admin.contrib.sqla.fields import InlineModelFormList
from flask_admin.form import RenderTemplateWidget
from flask_admin.model.template import macro
#from flask.ext.superadmin.model.backends.sqlalchemy.orm import AdminModelConverter as _AdminModelConverter
#from flask.ext import superadmin
#from wtforms.ext.sqlalchemy.orm import converts

from openspending.model import Account
from openspending.auth import require
from openspending.admin.helpers import LoadReport
from werkzeug.security import generate_password_hash

from jinja2 import Markup

#from settings import UPLOADED_FILES_DEST

from openspending.model.tags import TAG_OPTIONS

from slugify import slugify



#import copy

#see http://flask-admin.readthedocs.org/en/latest/api/mod_model/


class AccountView(sqla.ModelView):

    #form_overrides = dict(name=PasswordField)

    # form_extra_fields = {
    #     "password1": PasswordField('Password', validators=[]),
    #     "password2": PasswordField('Password (Again)', validators=[])
    # }

    form_excluded_columns = ('password', 'datasets',)


    # def validate_form(self, form):
        # if form.data.get('password1',None) == "" and \
        #             form.data.get('password2', None) == "":
        #     return True
        # if form.data.get('password1',None) != form.data.get('password2',None):
        #     raise ValidationError('Passwords do not match')
        # if form.data['password1'] == form.data.get('password2', None):
        #     return True
        # else:
        #     raise ValidationError('Passwords do not match')

        #if db.session.query(User).filter_by(login=self.login.data).count() > 0:
        #    raise ValidationError('Duplicate username')


    def is_accessible(self):
        return require.perms.is_admin()



    # Model handlers
    # def on_model_change(self, form, model, is_created=False):
    #def create_model(self, form):
        # if form.data.get('password1', None) != None:
        #     model.password = generate_password_hash(form.data['password1'])
        # return


class SourceFileView(sqla.ModelView):

    # def _list_thumbnail(view, context, model, name):
    #     if not model.rawfile:
    #         return ''

    #     return Markup('<img />')

    #     # return Markup('<img src="%s">' % url_for('static',
    #     #                                          filename=form.thumbgen_filename(model.path)))

    # column_formatters = {
    #     'rawfile': _list_thumbnail
    # }


    form_overrides = {
        'rawfile': form.FileUploadField
    }

    # Pass additional parameters to 'path' to FileUploadField constructor
    UPLOADED_FILES_DEST = current_app.config.get('UPLOADED_FILES_DEST', None)
    form_args = {
        'rawfile': {
            'label': 'File',
            'base_path': UPLOADED_FILES_DEST
        }
    }

    def is_accessible(self):
        return require.perms.is_admin()


class MetadataOrgView(sqla.ModelView):

    def is_accessible(self):
        return require.perms.is_admin()

class DataOrgView(sqla.ModelView):

    def is_accessible(self):
        return require.perms.is_admin()

class DatasetView(sqla.ModelView):

    def is_accessible(self):
        return require.perms.is_admin()

class SourceView(sqla.ModelView):

    def is_accessible(self):
        return require.perms.is_admin()

class RunView(sqla.ModelView):

    def is_accessible(self):
        return require.perms.is_admin()

class LogRecordView(sqla.ModelView):

    def is_accessible(self):
        return require.perms.is_admin()

class DataviewView(sqla.ModelView):

    def is_accessible(self):
        return require.perms.is_admin()

class FeedbackView(sqla.ModelView):

    def is_accessible(self):
        return require.perms.is_admin()

class TagsView(sqla.ModelView):

    form_extra_fields = {
        "type": SelectField(u'Type', choices=TAG_OPTIONS)
    }

    form_excluded_columns = ('slug_label','category',)

    column_list = ('slug_label', 'label','category','dataset_count',)

    def is_accessible(self):
        return require.perms.is_admin()


    # Model handlers
    def on_model_change(self, form, model, is_created=False):
    #def create_model(self, form):

        model.category = form.data['type']
        model.slug_label = slugify(str(model.label), separator="_")
        return


class TagByTagView(sqla.ModelView):

    form_excluded_columns = ('slug_label','children')

    # form_extra_fields = {
    #     "type": SelectField(u'Type', choices=TAG_OPTIONS)
    # }

    form_overrides = {
            'category': SelectField
        }
    form_args = {
        'category': {
            'choices': TAG_OPTIONS
        }
    }
    form_columns = ('label', 'category', 'weight', 'datasets', )

    form_widget_args = {
        'label':{
            'style': 'width:600px'
        },
        'category': {
            'style': 'width:600px;'
        },
        'weight':{
            'style': 'width:600px'
        },
        'datasets':{
            'style': 'width:600px'
        }
    }

    column_list = ('label', 'category', 'weight', 'dataset_count',)


    can_delete = True
    can_create = True

    # Model handlers
    # def on_model_change(self, form, model, is_created=False):
    # #def create_model(self, form):
    #     print "here this is", form.data.get('type')
    #     model.category = form.data['type']
    #     model.slug_label = slugify(str(model.label), separator="_")
    #     return

    def is_accessible(self):
        return require.perms.is_admin()


class TagByIndicatorView(sqla.ModelView):

    form_columns = ('label', 'description', 'tags')


    form_widget_args = {
        'label':{
            'style': 'width:600px'
        },
        'description': {
            'rows': 10,
            'style': 'width:600px;'
        },
        'tags':{
            'style': 'width:600px'
        }
    }

    column_list = ('label', 'tags_str')

    column_searchable_list = ('label',)

    can_delete = False
    can_create = False

    def is_accessible(self):
        return require.perms.is_admin()




class IndicatorManagerView(sqla.ModelView):

    can_delete = False
    can_create = False

    column_searchable_list = ('label',)

    column_list = ('label', 'name', 'description', 'update_at', 'metadataorg', )

    form_columns = ('label', 'description', 'metadataorg')

    form_overrides = dict(description=TextAreaField)

    form_widget_args = {
        'label':{
            'style': 'width:600px'
        },
        'description': {
            'rows': 10,
            'style': 'width:600px;'
        }
    }




    def is_accessible(self):
        return require.perms.is_admin()


class MetadataOrgManagerView(sqla.ModelView):

    can_delete = False
    can_create = True

    column_searchable_list = ('label',)

    column_list = ('label', 'description', 'dataset_count',)

    form_excluded_columns = ('lastUpdated',)

    #form_columns = ('label', 'description', )

    form_overrides = dict(description=TextAreaField)

    form_widget_args = {
        'label':{
            'style': 'width:600px'
        },
        'description': {
            'rows': 10,
            'style': 'width:600px;'
        }
    }

    def is_accessible(self):
        return require.perms.is_admin()

        
class IndicatorsView(sqla.ModelView):

    form_columns = ('update_freq','update_cycle','units',)

    column_list = ('label','source','dataorg','metadataorg', 'units','tags_str',)

    column_labels = dict(label='Indicator Name(Long)',source='Indicator Name(short)',dataorg='Direct Source',metadataorg='Originating Source',units='Units',tags_str='Category',)
    
    column_searchable_list = ('label',)
        
    can_delete = False
    can_create = False
    can_edit = True

    def is_accessible(self):
        return require.perms.is_admin()

class SourcesView(sqla.ModelView):

    column_list = ('dataorg','metadataorg','datatype','lastorgupdate', 'update_freq','update_cycle','scope', 'datalastupdated','whentoupdate')

    column_labels = dict(dataorg='Direct Source',metadataorg='Originating Source',dataype='Data Type', last='lastorgupdate',update_freq='Frequency',update_cycle='Cycle',datalastupdated='Last Updated in FIND',whentoupdate='When to Update in FIND',)
    
    column_searchable_list = ('label',)
    
    can_delete = False
    can_create = False
    can_edit = False

    def is_accessible(self):
        return require.perms.is_admin()


class QAListView(sqla.ModelView):
    column_searchable_list = ('name',)
    # columns list Data source link to admin page, has data, source_url, run log with cleaned and source, date injested
    def is_accessible(self):
        return require.perms.is_admin()
    can_delete = False
    can_create = False
    can_edit= False

    column_formatters = dict(name=macro('render_qalist'),
                            source_url=macro('render_sourceurl'),
                            report_url = macro('render_report'),
                            number_errors=macro('num_log_records'))
    #column_formatters = dict(dataset_admin_url=macro('render_price'))
    column_list= ('name', 'source_url', 'report_url', 'number_errors',)
    list_template = 'adminsection/qalist.html'




class IndexView(AdminIndexView):

    def is_accessible(self):
        return require.perms.is_admin()

    @expose('/')
    def index(self):
        return self.render('adminsection/index.jade')
        
def register_admin(app, db):

    from openspending.model import Source, Dataset, \
                                    DataOrg, MetadataOrg, Account, \
                                    Run, SourceFile, LogRecord, Dataview, \
                                    Feedback, Tags
        
    # flaskadmin = admin.Admin(app,
    #                     name="FIND Admin", 
    #                     index_view=IndexView(name='Home', 
    #                                 url='/coastaladmin',
    #                                 endpoint='coastal.admin'))

    flaskadmin = admin.Admin(app,
                        name="FIND Admin", 
                        index_view=IndexView(name='Home'))

    #flaskadmin = admin.Admin(app, name='FIND Admin')

    flaskadmin.add_view(AccountView(Account, db.session, endpoint='useraccount', category="Manager", name="User Management"))

    flaskadmin.add_view(FeedbackView(Feedback, db.session, endpoint='feedbackadmin', category="Manager", name="Feedback"))

    flaskadmin.add_view(TagByTagView(Tags, db.session, endpoint='tagbytag', category="Tagging", name="Tag By Tag"))

    flaskadmin.add_view(TagByIndicatorView(Dataset, db.session, endpoint='tagbyindicator', category="Tagging", name="Tag By Indicator"))

    flaskadmin.add_view(IndicatorManagerView(Dataset, db.session, endpoint='indicatormanager', category="Meta Data", name="Indicator Meta Data"))

    flaskadmin.add_view(MetadataOrgManagerView(MetadataOrg, db.session, endpoint='metadatamanager', category="Meta Data", name="Meta Data Orgs"))

    flaskadmin.add_view(DataviewView(Dataview, db.session, category='SysAdmin'))

    flaskadmin.add_view(MetadataOrgView(MetadataOrg, db.session, category='SysAdmin'))

    flaskadmin.add_view(DataOrgView(DataOrg, db.session, category='DataLoading'))

    flaskadmin.add_view(DatasetView(Dataset, db.session, category='DataLoading'))
    
    flaskadmin.add_view(SourceView(Source, db.session, category='DataLoading'))

    flaskadmin.add_view(SourceFileView(SourceFile, db.session,endpoint='sourcefileadmin', category='DataLoading'))
    
    flaskadmin.add_view(RunView(Run, db.session, category='DataLoading'))

    flaskadmin.add_view(LogRecordView(LogRecord, db.session, category='DataLoading'))

    flaskadmin.add_view(TagsView(Tags, db.session, endpoint='tagsadmin', category='SysAdmin'))

    flaskadmin.add_view(IndicatorsView(Dataset, db.session, endpoint='indicatorsadmin', category='Reports', name="Indicators"))

    flaskadmin.add_view(SourcesView(Dataset, db.session, endpoint='sourcesadmin', category='Reports', name="Sources"))

    flaskadmin.add_view(QAListView(Source, db.session, category='DataLoading', endpoint="qaview", name="QA Links"))

    #flaskadmin.add_view(DTView(Dataset, db.session, endpoint='dtadmin', category='Indicators', name="DT"))
    
    return flaskadmin

