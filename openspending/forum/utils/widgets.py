# -*- coding: utf-8 -*-
"""
    flaskbb.utils.widgets
    ~~~~~~~~~~~~~~~~~~~~~

    Additional widgets for wtforms

    :copyright: (c) 2014 by the FlaskBB Team.
    :license: BSD, see LICENSE for more details.
"""
import simplejson as json
from datetime import datetime
from wtforms.widgets.core import Select, HTMLString, html_params



class MultiSelect(object):
    """
    Renders a megalist-multiselect widget.


    The field must provide an `iter_choices()` method which the widget will
    call on rendering; this method must yield tuples of
    `(value, label, selected)`.
    """

    def __call__(self, field, **kwargs):
        kwargs.setdefault('id', field.id)
        src_list, dst_list = [], []

        for val, label, selected in field.iter_choices():
            if selected:
                dst_list.append({'label':label, 'listValue':val})
            else:
                src_list.append({'label':label, 'listValue':val})
        kwargs.update(
            {
                'data-provider-src':json.dumps(src_list),
                'data-provider-dst':json.dumps(dst_list)
            }
        )
        html = ['<div %s>' % html_params(name=field.name, **kwargs)]
        html.append('</div>')
        return HTMLString(''.join(html))
