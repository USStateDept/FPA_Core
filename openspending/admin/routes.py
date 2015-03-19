

from flask.ext.superadmin.model.backends.sqlalchemy import ModelAdmin
#from flask.ext.superadmin.model.backends.sqlalchemy.orm import AdminModelConverter as _AdminModelConverter
#from flask.ext import superadmin
#from wtforms.ext.sqlalchemy.orm import converts

#import copy




class SourceModel(ModelAdmin):
    list_display = ('name',)
    list_per_page = 100

    search_fields = ('name',)

    def save_model(self, instance, form, adding=False):
        form.populate_obj(instance)
        if adding:
            self.session.add(instance)
        self.session.commit()
        return instance


def register_admin(flaskadmin, db):

    from openspending.model import Source
    



    #flaskadmin.add_view(MyAdminView(category='Test'))

    flaskadmin.register(Source, SourceModel, session=db.session)


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