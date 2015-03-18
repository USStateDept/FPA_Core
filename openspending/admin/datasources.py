
from flask_admin.contrib import sqla

from flask_admin.form import RenderTemplateWidget
from flask_admin.model.form import InlineFormAdmin
from flask_admin.contrib.sqla.form import InlineModelConverter
from flask_admin.contrib.sqla.fields import InlineModelFormList

from openspending.model import Source



# This widget uses custom template for inline field list
class CustomInlineFieldListWidget(RenderTemplateWidget):
    def __init__(self):
        super(CustomInlineFieldListWidget, self).__init__('field_list.html')


# This InlineModelFormList will use our custom widget
class CustomInlineModelFormList(InlineModelFormList):
    widget = CustomInlineFieldListWidget()


# Create custom InlineModelConverter and tell it to use our InlineModelFormList
class CustomInlineModelConverter(InlineModelConverter):
    inline_field_list_type = CustomInlineModelFormList




# Customized inline form handler
class InlineModelForm(InlineFormAdmin):
    form_excluded_columns = ('dataset_id','creator_id',)

    form_label = 'Datasource'

    def __init__(self):
        return super(InlineModelForm, self).__init__(Source)

    def postprocess_form(self, form_class):
        return form_class

    def on_model_change(self, form, model):
        return

from openspending.model import Account

from flask_admin.contrib.sqla import filters
from wtforms import validators


# class DataSourceAdmin(sqla.ModelView):
#     # Disable model creation
#     can_create = False

#     # Override displayed fields
#     column_list = ('name', 'url')

#     # def __init__(self, Source, session):
#     #     # Just call parent class with predefined model.
#     #     super(DataSourceAdmin, self).__init__(Source, session, url='test')





# # Customized Post model admin
# class DataSourceAdmin(sqla.ModelView):
#     # Visible columns in the list view
#     column_exclude_list = ['dataset_id']

#     # List of columns that can be sorted. For 'user' column, use User.username as
#     # a column.
#     column_sortable_list = ('name', ('creator', Account.name), 'url')

#     # Rename 'title' columns to 'Post Title' in list view
#     column_labels = dict(title='Post Title')

#     column_searchable_list = ('name', Account.name)

#     column_filters = ('name',
#                       'url',
#                       filters.FilterLike(Source.name, 'Fixed Title', options=(('test1', 'Test 1'), ('test2', 'Test 2'))))

#     # Pass arguments to WTForms. In this case, change label for text field to
#     # be 'Big Text' and add required() validator.
#     form_args = dict(
#                     text=dict(label='Big Text', validators=[validators.required()])
#                 )

#     form_ajax_refs = {
#         'creator': {
#             'fields': (Account.name, Account.email)
#         }
#     }

#     def __init__(self, Source, session):
#         # Just call parent class with predefined model.
#         super(DataSourceAdmin, self).__init__(Source, session)


class DataSourceAdminInlineModelConverter( InlineModelConverter ):
    def contribute( self, converter, model, form_class, inline_model ):
        mapper = object_mapper( model() )
        target_mapper = object_mapper( inline_model() )

        info = self.get_info( inline_model )

        # Find reverse property
        for prop in target_mapper.iterate_properties:
            if hasattr( prop, 'direction' ) and prop.direction.name == 'MANYTOMANY':
                if issubclass( model, prop.mapper.class_ ):
                    reverse_prop = prop
                    break
        else:
            raise Exception( 'Cannot find reverse relation for model %s' % info.model )

        # Find forward property
        for prop in mapper.iterate_properties:
            if hasattr( prop, 'direction' ) and prop.direction.name == 'MANYTOMANY':
                if prop.mapper.class_ == target_mapper.class_:
                    forward_prop = prop
                    break
        else:
            raise Exception( 'Cannot find forward relation for model %s' % info.model )
        child_form = info.get_form()
        if child_form is None:
            child_form = get_form(
                info.model, converter,
                only=DataSourceAdmin.form_columns,
                exclude=DataSourceAdmin.form_excluded_columns,
                field_args=DataSourceAdmin.form_args,
                hidden_pk=True
            )
        child_form = info.postprocess_form( child_form )

        setattr( form_class, forward_prop.key + '_add', self.inline_field_list_type(
            child_form, self.session, info.model, reverse_prop.key, info
        ) )

        return form_class

class DataSourceAdmin( sqla.ModelView ):
    inline_model_form_converter = DataSourceAdminInlineModelConverter
    column_searchable_list = ( Source.name, Account.name )

    def __init__ (self, Source, session):
        super(DataSourceAdmin, self).__init__(Source, session, name='Datasources')

    def index_view(self):
        return "what does this do?"

    def init_search( self ):
        r = super( DataSourceAdmin, self ).init_search()
        print r
        print "!!!!!!!!!!Got here"
        #self._search_joins['tags'] = Account.name
        return r








# class DataSourceAdmin(sqla.ModelView):
#     column_excude_list = ['runs']
#     form_columns = ('name',)
#     form_excluded_columns = ('runs',)

#     #inline_model_form_converter = CustomInlineModelConverter

#     inline_models = (Source,)


#     # def __init__ (self, Source, session):
#     #     super(DatasourceAdmin, self).__init__(Source, session, name='Datasources', endpoint='testadmin')


# Create admin



