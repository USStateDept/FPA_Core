

#from flask.ext.superadmin.model.backends.sqlalchemy import ModelAdmin
#from flask.ext.superadmin.model.base import BaseModelAdmin
from flask.ext import wtf
from flask_admin.contrib import sqla
from flask.ext.admin.contrib.sqla.view import func
from wtforms.fields import StringField, PasswordField, BooleanField, SelectField, TextAreaField
from wtforms.validators import DataRequired, ValidationError
from flask import flash, current_app
from flask_admin import form

from flask_admin.model.form import InlineFormAdmin
from flask_admin.contrib.sqla.form import InlineModelConverter
from flask_admin.contrib.sqla.fields import InlineModelFormList
from flask_admin.form import RenderTemplateWidget
#from flask.ext.superadmin.model.backends.sqlalchemy.orm import AdminModelConverter as _AdminModelConverter
#from flask.ext import superadmin
#from wtforms.ext.sqlalchemy.orm import converts

from openspending.model import Account
from openspending.auth import require
from werkzeug.security import generate_password_hash

from jinja2 import Markup

#from settings import UPLOADED_FILES_DEST

from openspending.model.tags import TAG_OPTIONS

from slugify import slugify



#import copy

#see http://flask-admin.readthedocs.org/en/latest/api/mod_model/




class AccountView(sqla.ModelView):

    #form_overrides = dict(name=PasswordField)

    form_extra_fields = {
        "password1": PasswordField('Password', validators=[DataRequired()]),
        "password2": PasswordField('Password (Again)', validators=[DataRequired()])
    }

    form_excluded_columns = ('password', 'datasets',)


    def validate_form(self, form):
        if form.data['password1'] == None:
            return False
        if form.data['password1'] == "":
            raise ValidationError('Passwords do not match')
        if form.data['password1'] == form.data['password2']:
            return True
        else:
            raise ValidationError('passwords do not match')
        return False

        #if db.session.query(User).filter_by(login=self.login.data).count() > 0:
        #    raise ValidationError('Duplicate username')


    def is_accessible(self):
        return require.account.is_admin()



    # Model handlers
    def on_model_change(self, form, model, is_created=False):
    #def create_model(self, form):
        if form.data['password1'] != None:
            model.password = generate_password_hash(form.data['password1'])
        return


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
        return require.account.is_admin()


class MetadataOrgView(sqla.ModelView):

    def is_accessible(self):
        return require.account.is_admin()

class DataOrgView(sqla.ModelView):

    def is_accessible(self):
        return require.account.is_admin()

class DatasetView(sqla.ModelView):

    def is_accessible(self):
        return require.account.is_admin()

class SourceView(sqla.ModelView):

    def is_accessible(self):
        return require.account.is_admin()

class RunView(sqla.ModelView):

    def is_accessible(self):
        return require.account.is_admin()

class LogRecordView(sqla.ModelView):

    def is_accessible(self):
        return require.account.is_admin()

class DataviewView(sqla.ModelView):

    def is_accessible(self):
        return require.account.is_admin()

class FeedbackView(sqla.ModelView):

    def is_accessible(self):
        return require.account.is_admin()

class TagsView(sqla.ModelView):

    form_extra_fields = {
        "type": SelectField(u'Type', choices=TAG_OPTIONS)
    }

    form_excluded_columns = ('slug_label','category',)

    column_list = ('slug_label', 'label','category','dataset_count',)

    def is_accessible(self):
        return require.account.is_admin()


    # Model handlers
    def on_model_change(self, form, model, is_created=False):
    #def create_model(self, form):

        model.category = form.data['type']
        model.slug_label = slugify(str(model.label), separator="_")
        return


class TagByTagView(sqla.ModelView):

    form_excluded_columns = ('slug_label','category', 'children', 'category')

    form_extra_fields = {
        "type": SelectField(u'Type', choices=TAG_OPTIONS)
    }

    form_columns = ('label', 'type', 'weight', 'datasets', )


    form_widget_args = {
        'label':{
            'style': 'width:600px'
        },
        'type': {
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


    can_delete = False
    can_create = False

    # Model handlers
    def on_model_change(self, form, model, is_created=False):
    #def create_model(self, form):

        model.category = form.data['type']
        model.slug_label = slugify(str(model.label), separator="_")
        return

    def is_accessible(self):
        return require.account.is_admin()


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
        return require.account.is_admin()




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
        return require.account.is_admin()


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
        return require.account.is_admin()

        
class SourcesView(sqla.ModelView):

    column_list = ('label', 'dataType','dataorg','webservice','updated_at')
    
    column_searchable_list = ('label',)
    
    form_excluded_columns = ('source','name','created_at','runs','dataviews','datalastupdated')
    
    form_columns = ('label','units', 'dataorg','webservice','orgurl' ,'description', 'tags', 'updated_at','update_freq','update_cycle', 'years', 'stats','agency', 'managers', 'loaded', 'published', 'tested','stats','notes')
    
    #column_filters = ('webservice',)
    
    #session.query(func.count(User.id)).\
    #    group_by(User.name)

    
    form_widget_args = {
        'label':{
            'style': 'width:100%'
        },
        'dataorg':{
            'style': 'width:100%'
        },
        'description': {
            'rows': 10,
            'style': 'width:100%;'
        },
		'updated_at':{
            'style': 'width:50%'
        },
        'years':{
            'style': 'width:100%'
        },
        'stats':{
            'style': 'width:50%'
        },
        'managers':{
            'style': 'width:100%'
        }
    }

    can_delete = False
    can_create = False

    def is_accessible(self):
        return require.account.is_admin()

#class DTView(sqla.ModelView):

    #def get_count_query(self):
    #    return self.view.session.query(func.count(dataType))
    
    #def dt(self):
    #    return dataset.get_count_query(self)
    
    #def is_accessible(self):
    #    return require.account.is_admin()
        
def register_admin(flaskadmin, db):

    from openspending.model import Source, Dataset, DataOrg, MetadataOrg, Account, Run, SourceFile, LogRecord, Dataview, Feedback, Tags
    


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

    flaskadmin.add_view(SourcesView(Dataset, db.session, endpoint='sourcesadmin', category='Indicators', name="Sources"))

    #flaskadmin.add_view(DTView(Dataset, db.session, endpoint='dtadmin', category='Indicators', name="DT"))
    
    return flaskadmin



#CUSTOM ADMIN VIEW if needed in the future


# class AdminModelConverter(_AdminModelConverter):
#     """
#         SQLAlchemy model to form converter
#     """

#     def convert(self, model, mapper, prop, field_args, *args):
#         kwargs = {
#             'validators': [],
#             'filters': []
#         }

#         if field_args:
#             kwargs.update(field_args)

#         if hasattr(prop, 'direction'):
#             remote_model = prop.mapper.class_
#             local_column = prop.local_remote_pairs[0][0]

#             kwargs.update({
#                 'allow_blank': local_column.nullable,
#                 'label': self._get_label(prop.key, kwargs),
#                 'query_factory': lambda: self.view.session.query(remote_model)
#             })
#             if local_column.nullable:
#                 kwargs['validators'].append(validators.Optional())
#             elif prop.direction.name not in ('MANYTOMANY', 'ONETOMANY'):
#                 kwargs['validators'].append(validators.Required())

#             # Override field type if necessary
#             override = self._get_field_override(prop.key)
#             if override:
#                 return override(**kwargs)

#             if prop.direction.name == 'MANYTOONE':
#                 return QuerySelectField(widget=form.ChosenSelectWidget(),
#                                         **kwargs)
#             elif prop.direction.name == 'ONETOMANY':
#                 # Skip backrefs
#                 if not local_column.foreign_keys and self.view.hide_backrefs:
#                     return None

#                 return QuerySelectMultipleField(
#                                 widget=form.ChosenSelectWidget(multiple=True),
#                                 **kwargs)
#             elif prop.direction.name == 'MANYTOMANY':
#                 return QuerySelectMultipleField(
#                                 widget=form.ChosenSelectWidget(multiple=True),
#                                 **kwargs)
#         else:
#             # Ignore pk/fk
#             if hasattr(prop, 'columns'):
#                 column = prop.columns[0]

#                 # Do not display foreign keys - use relations
#                 if column.foreign_keys:
#                     return None

#                 unique = False

#                 if column.primary_key:
#                     # By default, don't show primary keys either
#                     if self.view.fields is None:
#                         return None

#                     # If PK is not explicitly allowed, ignore it
#                     if prop.key not in self.view.fields:
#                         return None

#                     kwargs['validators'].append(Unique(self.view.session,
#                                                        model,
#                                                        column))
#                     unique = True

#                 # If field is unique, validate it
#                 if column.unique and not unique:
#                     kwargs['validators'].append(Unique(self.view.session,
#                                                        model,
#                                                        column))

#                 if column.nullable:
#                     kwargs['validators'].append(validators.Optional())
#                 else:
#                     kwargs['validators'].append(validators.Required())

#             # Apply label
#             kwargs['label'] = self._get_label(prop.key, kwargs)

#             # Override field type if necessary
#             override = self._get_field_override(prop.key)
#             if override:
#                 return override(**kwargs)

#             return super(AdminModelConverter, self).convert(model, mapper,
#                                                             prop, kwargs)

#     @converts('Date')
#     def convert_date(self, field_args, **extra):
#         field_args['widget'] = form.DatePickerWidget()
#         return fields.DateField(**field_args)




# class ModelAdmin(_ModelAdmin):

#     def get_converter(self):
#         return AdminModelConverter
 
#     # def is_accessible(self):
#     #     return is_authenticated()
 
#     # def _handle_view(self, name, *args, **kwargs):
#     #     if not self.is_accessible():
#     #         return authenticate()



# class MyAdminView(superadmin.BaseView):
#     @superadmin.expose('/')
#     def index(self):

#         from openspending.model.dataset import Dataset
#         #get list of sources
#         q = Dataset.get_all_admin().all()
#         headers_mapping = {'datasource': 'Datasource', 
#                             'name': 'Indicator', 
#                             'status': 'Status', 
#                             'data_type':'Data Type', 
#                             'has_file':'Has File'}
#         HEADERS = headers_mapping.values()
#         returnset = []
#         for obj in q:
#             for sourceobj in obj.sources.all():
#                 theobj = sourceobj.as_dict()
#                 tempobj = copy.deepcopy(headers_mapping)
#                 for colkey in tempobj.keys():
#                     if (colkey == 'datasource'):
#                         tempobj['datasource'] = obj.name
#                     else:
#                         if colkey in theobj.keys():
#                             tempobj[colkey] = theobj[colkey]
#                 returnset.append(tempobj.values())
#         return self.render('superadmin/tablelist.html',
#                             table_headers = HEADERS,
#                             tablerows = returnset)



#class DatasetView(sqla.ModelView):

    # def _list_thumbnail(view, context, model, name):
    #     if not model.rawfile:
    #         return ''

    #     return Markup('<img />')

    #     # return Markup('<img src="%s">' % url_for('static',
    #     #                                          filename=form.thumbgen_filename(model.path)))

    # column_formatters = {
    #     'rawfile': _list_thumbnail
    # }


    # form_overrides = {
    #     'rawfile': form.FileUploadField
    # }

    # # Pass additional parameters to 'path' to FileUploadField constructor
    # form_args = {
    #     'rawfile': {
    #         'label': 'File',
    #         'base_path': UPLOADS_FOLDER
    #     }
    # }





    



# class SourceModel(ModelAdmin):
#     list_display = ('name',)
#     list_per_page = 100

#     search_fields = ('name',)

#     def save_model(self, instance, form, adding=False):
#         form.populate_obj(instance)
#         if adding:
#             self.session.add(instance)
#         self.session.commit()
#         return instance

