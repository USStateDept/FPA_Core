import json
import urllib2

from flask import url_for, current_app

from openspending.core import db, mail
from openspending.model.account import Account
from openspending.tests.base import ControllerTestCase
from openspending.tests.helpers import make_account, load_fixture
from flask.ext.login import current_user, login_user
from openspending.auth import require
from werkzeug.security import generate_password_hash





class TestLockDownController(ControllerTestCase):
    def setUp(self):
        super(TestLockDownController, self).setUp()
        current_app.config['LOCKDOWN_FORCE'] = True

    def tearDown(self):
        current_app.config['LOCKDOWN_FORCE'] = False

    def test_all_pages_locked(self):
        response = self.client.get('account.login')
        assert '302' in response.status

        response = self.client.get('api_v2.categories.dataorgs')
        assert '302' in response.status

    def test_login_attempt_failed(self):
        response = self.client.post(url_for('home.lockdown'),
                                    data={'username': "notright",'password':'morenotright'})
        assert 'Dev site for FIND' in response.data

    def test_login_success(self):
        response = self.client.post(url_for('home.lockdown'),
                                    data={'username': "test",'password':'test'}, follow_redirects=True)
        assert '<div class="container">' in response.data






class TestAccountController(ControllerTestCase):

    def setUp(self):
        super(TestAccountController, self).setUp()

        # Create test user
        current_app.config['LOCKDOWN_FORCE'] = False
        self.user = make_account('testuser')

    def test_account_create_gives_api_key(self):
        account = make_account()
        assert len(account.api_key) == 36

    def test_after_login(self):
        self.client.get(url_for('account.login'))

    def test_after_logout(self):
        self.client.get(url_for('account.logout'))


    # Account Register

    # Account reset password


    def test_anon_user_access(self):
        self.user = None

        # Get the user profile for an anonymous user
        response = self.client.get(url_for('home.index'), follow_redirects = True)
        assert '200' in response.status, \
            'home not successly shown for new user'
        print response.data
        assert '<div class="container">' \
            in response.data

        # Get the user profile for an anonymous user
        response = self.client.get('/admin', follow_redirects = True)

        assert '403' in response.status, \
            "Anon user cannot access admin"

    # to be implemented

    # def test_unverified_user(self):

    #     self.user.verified = False
    #     db.session.commit()
    #     login_user(self.user, remember=True)
    #     response = self.client.get(url_for('home.index'), follow_redirects = True)

    #     assert '302' in response.status, \
    #         'Redirect unverified user to enter password stuff'

    # def test_admin_access(self):
    #     self.user.admin = True
    #     password = generate_password_hash('test')
    #     self.user.password = password
    #     db.session.commit()

    #     print self.user.email

    #     self.client.post(url_for('account.login'), data=dict(
    #                         login=self.user.email,
    #                         password='test'
    #                     ), follow_redirects=True)

    #     print "here it is", require.account.is_admin()

    #     response = self.client.get(url_for('home.index'))
    #     assert '200' in response.status, \
    #         'Admin is happy on dinex'
    #     assert 'Explore country-level indicators from a variety of sources and sectors' \
    #         in response.data 

    #     response = self.client.get('/admin/useraccount/')
    #     assert '200' in response.status, "Admin has access to user management"

