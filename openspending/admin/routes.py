

#from flask.ext.superadmin.model.backends.sqlalchemy import ModelAdmin
#from flask.ext.superadmin.model.base import BaseModelAdmin
from flask.ext import wtf
from flask_admin.contrib import sqla
from wtforms.fields import StringField, PasswordField, BooleanField, SelectField
from wtforms.validators import Required, ValidationError
from flask import flash
from flask_admin import form
#from flask.ext.superadmin.model.backends.sqlalchemy.orm import AdminModelConverter as _AdminModelConverter
#from flask.ext import superadmin
#from wtforms.ext.sqlalchemy.orm import converts

from openspending.model import Account
from openspending.auth import require
from werkzeug.security import generate_password_hash

from jinja2 import Markup

from settings import UPLOADED_FILES_DEST

from openspending.model.tags import TAG_OPTIONS

from slugify import slugify


#import copy

#see http://flask-admin.readthedocs.org/en/latest/api/mod_model/




class AccountView(sqla.ModelView):

    #form_overrides = dict(name=PasswordField)

    form_extra_fields = {
        "password1": PasswordField('Password', validators=[Required()]),
        "password2": PasswordField('Password (Again)', validators=[Required()])
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







def register_admin(flaskadmin, db):

    from openspending.model import Source, Dataset, DataOrg, MetadataOrg, Account, Run, SourceFile, LogRecord, Dataview, Feedback, Tags
    


    flaskadmin.add_view(AccountView(Account, db.session, endpoint='useraccount'))

    flaskadmin.add_view(DataviewView(Dataview, db.session))

    flaskadmin.add_view(MetadataOrgView(MetadataOrg, db.session))

    flaskadmin.add_view(DataOrgView(DataOrg, db.session))

    flaskadmin.add_view(DatasetView(Dataset, db.session))
    
    flaskadmin.add_view(SourceView(Source, db.session))

    flaskadmin.add_view(SourceFileView(SourceFile, db.session,endpoint='sourcefileadmin'))
    
    flaskadmin.add_view(RunView(Run, db.session))

    flaskadmin.add_view(LogRecordView(LogRecord, db.session))

    flaskadmin.add_view(FeedbackView(Feedback, db.session, endpoint='feedbackadmin'))

    flaskadmin.add_view(TagsView(Tags, db.session, endpoint='tagsadmin'))



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

