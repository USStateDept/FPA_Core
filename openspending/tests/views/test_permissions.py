import re
import csv
import json
import datetime
from StringIO import StringIO

from flask import url_for, current_app
from flask.ext.login import login_user

from openspending.core import db
from openspending.model.dataset import Dataset
from openspending.tests.base import ControllerTestCase
from openspending.tests.helpers import (make_account, load_fixture)
from openspending.lib.helpers import get_source
from openspending.command.search import reindex as reindex_search
from werkzeug.security import generate_password_hash
from werkzeug.routing import BuildError


ADMIN_ONLY_GET = ["dataset.index_view",
                    "dataset.edit_view",
                    "dataset.create_view",
                    "logrecord.index_view",
                    "logrecord.edit_view",
                    "logrecord.create_view",
                    "run.index_view",
                    "run.edit_view",
                    "run.create_view",
                    "source.index_view",
                    "source.edit_view",
                    "source.create_view",
                    "sourcefileadmin.index_view",
                    "sourcefileadmin.edit_view",
                    "sourcefileadmin.create_view",
                    "useraccount.index_view",
                    "useraccount.edit_view",
                    "useraccount.create_view"]


ADMIN_ONLY_POST = [
            "dataset.edit_view",
            "dataset.create_view",
            "logrecord.edit_view",
            "logrecord.create_view",
            "run.edit_view",
            "run.create_view",
            "source.edit_view",
            "source.create_view",
            "sourcefileadmin.edit_view",
            "sourcefileadmin.create_view",
            "useraccount.edit_view",
            "useraccount.create_view",
            "dataset.action_view",
            "dataset.ajax_update",
            "dataset.delete_view",
            "logrecord.action_view",
            "logrecord.ajax_update",
            "logrecord.delete_view",
            "run.action_view",
            "run.ajax_update",
            "run.delete_view",
            "source.action_view",
            "source.ajax_update",
            "source.delete_view",
            "sourcefileadmin.action_view",
            "sourcefileadmin.ajax_update",
            "sourcefileadmin.delete_view",
            "useraccount.action_view",
            "useraccount.ajax_update",
            "useraccount.delete_view"
            ]

MODERATOR_GET = [
        "dataorg.edit_view",
        "dataorg.create_view",
        "dataview.index_view",
        "dataview.edit_view",
        "dataview.create_view",
        "feedbackadmin.index_view",
        "feedbackadmin.edit_view",
        "feedbackadmin.create_view",
        "management.overview",
        "management.edit_category",
        "management.add_category",
        "management.forums",
        "management.add_forum",
        "management.edit_forum",
        "management.add_forum",
        "management.reports",
        "management.unread_reports",
        "indicatormanager.index_view",
        "indicatormanager.edit_view",
        "indicatormanager.create_view",
        "metadatamanager.index_view",
        "metadatamanager.edit_view",
        "metadatamanager.create_view",
        "metadataorg.index_view",
        "metadataorg.edit_view",
        "metadataorg.create_view",
        "qaview.index_view",
        "qaview.edit_view",
        "qaview.create_view",
        "sourcesadmin.index_view",
        "sourcesadmin.edit_view",
        "sourcesadmin.create_view",
        "tagbyindicator.index_view",
        "tagbyindicator.edit_view",
        "tagbyindicator.create_view",
        "tagbytag.index_view",
        "tagbytag.edit_view",
        "tagbytag.create_view",
        "tagsadmin.index_view",
        "tagsadmin.edit_view",
        "tagsadmin.create_view",
        "datasets_api2.field_polling_check",
        "datasets_api2.field",
        "datasets_api2.ORoperations",
        "findadmin.dataloader",
        "findadmin.report",
        "forum.view_topic"]


MODERATOR_POST = [
        "dataorg.edit_view",
        "dataorg.create_view",
        "dataview.edit_view",
        "dataview.create_view",
        "feedbackadmin.edit_view",
        "feedbackadmin.create_view",
        "management.edit_category",
        "management.add_category",
        "management.add_forum",
        "management.edit_forum",
        "management.add_forum",
        "indicatormanager.edit_view",
        "indicatormanager.create_view",
        "metadatamanager.edit_view",
        "metadatamanager.create_view",
        "metadataorg.edit_view",
        "metadataorg.create_view",
        "qaview.edit_view",
        "qaview.create_view",
        "sourcesadmin.edit_view",
        "sourcesadmin.create_view",
        "tagbyindicator.edit_view",
        "tagbyindicator.create_view",
        "tagbytag.edit_view",
        "tagbytag.create_view",
        "tagsadmin.edit_view",
        "tagsadmin.create_view",
        "forum.view_topic",
        "dataorg.action_view",
        "dataorg.ajax_update",
        "dataorg.delete_view",
        "dataview.action_view",
        "dataview.ajax_update",
        "dataview.delete_view",
        "feedbackadmin.action_view",
        "feedbackadmin.ajax_update",
        "feedbackadmin.delete_view",
        "management.delete_category",
        "management.delete_forum",
        "management.report_markread",
        "management.report_markread",
        "indicatormanager.action_view",
        "indicatormanager.ajax_update",
        "indicatormanager.delete_view",
        "metadatamanager.action_view",
        "metadatamanager.ajax_update",
        "metadatamanager.delete_view",
        "metadataorg.action_view",
        "metadataorg.ajax_update",
        "metadataorg.delete_view",
        "qaview.action_view",
        "qaview.ajax_update",
        "qaview.delete_view",
        "sourcesadmin.action_view",
        "sourcesadmin.ajax_update",
        "sourcesadmin.delete_view",
        "tagbyindicator.action_view",
        "tagbyindicator.ajax_update",
        "tagbyindicator.delete_view",
        "tagbytag.action_view",
        "tagbytag.ajax_update",
        "tagbytag.delete_view",
        "tagsadmin.action_view",
        "tagsadmin.ajax_update",
        "tagsadmin.delete_view",
        "datasets_api2.create",
        "datasets_api2.apply_default_model",
        "datasets_api2.save_default_model",
        "datasets_api2.update_model_createnew",
        "datasets_api2.field_polling_post",
        "datasets_api2.update_model",
        "datasets_api2.delete",
        "datasets_api2.update",
        "forum.delete_topic",
        "forum.highlight_topic",
        "forum.lock_topic",
        "forum.trivialize_topic",
        "forum.unlock_topic",
        "forum.delete_topic",
        "forum.highlight_topic",
        "forum.lock_topic",
        "forum.trivialize_topic",
        "forum.unlock_topic"
        ]

AUTHENTICATED_GET = [
                "forum.index",
                "forum.new_topic",
                "forum.new_topic",
                "forum.view_category",
                "forum.view_category",
                "forum.view_forum",
                "forum.view_forum",
                "forum.manage_forum",
                "forum.manage_forum",
                "forum.view_post",
                "forum.edit_post",
                "forum.raw_post",
                "forum.report_post",
                "forum.search",
                "forum.view_topic",
                "forum.new_post",
                "forum.reply_post",
                "forum.new_post",
                "forum.topictracker",
                #"account.logout",
                #"user.saveData",
                "user.deleteData",
                "forum.memberlist"
                ]

AUTHENTICATED_POST = [
                "forum.markread",
                "forum.markread",
                "forum.delete_post",
                "forum.track_topic",
                "forum.untrack_topic",
                "forum.track_topic",
                "forum.untrack_topic",
                "forum.new_topic",
                "forum.new_topic",
                "forum.manage_forum",
                "forum.manage_forum",
                "forum.edit_post",
                "forum.raw_post",
                "forum.report_post",
                "forum.search",
                "forum.view_topic",
                "forum.new_post",
                "forum.reply_post",
                "forum.new_post",
                "dataview_api2.create"
                ]

class TestDatasetController(ControllerTestCase):

    def setUp(self):
        super(TestDatasetController, self).setUp()
        current_app.config['LOCKDOWN_FORCE'] = False
        current_app.config['PRESERVE_CONTEXT_ON_EXCEPTION'] = False
        #self.source = csvimport_fixture("sci_study")

        self.authuser = make_account('authuser', email='authuser@test.com', verified=True)
        self.authuser.password = generate_password_hash("password")
        self.moduser = make_account('moduser',  email='moduser@test.com', moderator=True)
        self.moduser.password = generate_password_hash("password")
        self.adminuser = make_account('adminuser',  email='adminuser@test.com', admin=True)
        self.adminuser.password = generate_password_hash("password")

        db.session.commit()

    def login(self, c, user):
        res= c.post(url_for('account.login'), 
                            data=dict(login=user.email,
                                        password='password'), follow_redirects=True)
        return res

    def router_success(self,c,route, method='get'):
        try:
            if method == 'post':
                response = c.post(url_for(route), follow_redirects=True)
            else:
                response = c.get(url_for(route), follow_redirects=True)
            assert ('200' in response.status or '404' in response.status) \
                and 'Sign into FIND.' not in response.data, \
                "Testing route %s with url\n%s"%(route,url_for(route)) 
            return response
        except BuildError, e:
            print "BUILD ERROR", e
        except AssertionError, e:
            print "RAISING AGAIN", e
            raise AssertionError(e)
        except Exception, e:
            print "Error", e

    def router_failure(self,c,route, method='get'):
        try:
            if method == 'post':
                response = c.post(url_for(route), follow_redirects=True)
            else:
                response = c.get(url_for(route), follow_redirects=True)
            assert '404' in response.status or \
                    'This feature is only for administrators' in response.data or \
                    'Sign into FIND.' in response.data \
                    or 'error' in response.data,\
                        "Testing route %s with url\n%s"%(route,url_for(route)) 
            return response
        except BuildError, e:
            print "BUILD ERROR", e
        except AssertionError, e:
            print "RAISING AGAIN", e
            raise AssertionError(e)
        except Exception, e:
            print "Error", e
        # except Exception, e:
        #     print "HITING AN ERROR", e


    def test_admin_gets(self):
        with self.client as c:
            self.login(c, self.adminuser)
            for route in ADMIN_ONLY_GET:
                self.router_success(c, route)
            for route in MODERATOR_GET:
                self.router_success(c, route)
            for route in AUTHENTICATED_GET:
                self.router_success(c, route) 

    def test_admin_posts(self):
        with self.client as c:
            self.login(c, self.adminuser)
            for route in ADMIN_ONLY_POST:
                self.router_success(c, route, 'post')
            for route in MODERATOR_POST:
                self.router_success(c, route, 'post')
            for route in AUTHENTICATED_POST:
                self.router_success(c, route, 'post') 

    def test_auth_gets(self):
        with self.client as c:
            self.login(c, self.authuser)
            for route in ADMIN_ONLY_GET:
                self.router_failure(c, route)
            for route in MODERATOR_GET:
                self.router_failure(c, route)
            for route in AUTHENTICATED_GET:
                self.router_success(c, route) 

    def test_auth_posts(self):
        with self.client as c:
            self.login(c, self.authuser)
            for route in ADMIN_ONLY_POST:
                self.router_failure(c, route, 'post')
            for route in MODERATOR_POST:
                self.router_failure(c, route, 'post')
            for route in AUTHENTICATED_POST:
                self.router_success(c, route, 'post') 


    def test_testing_test(self):
        with self.client as c:
            self.login(c, self.authuser)
            self.router_success(c,"forum.index", method='get')
            response = self.router_success(c, "dataview_api2.create", method='post')