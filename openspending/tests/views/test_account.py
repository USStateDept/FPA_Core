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
    """
    Test the lockdown function for the beta site
    """
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
    # check that user cannot regiseter with same email
    # check that email is in whitelist


    def test_anon_user_access(self):
        self.user = None

        # Get the user profile for an anonymous user
        response = self.client.get(url_for('home.index'), follow_redirects = True)
        assert '200' in response.status, \
            'home not successly shown for new user'
        assert '<div class="container">' \
            in response.data

        # Get the user profile for an anonymous user
        response = self.client.get('/admin', follow_redirects = True)

        assert '403' in response.status, \
            "Anon user cannot access admin"


    def test_trigger_reset(self):
        """
        user should be able to trigger their own reset
        """
        oldhash = self.user.login_hash
        res = self.client.post(url_for("account.trigger_reset"), data=dict(email=self.user.email), follow_redirects=True)
        assert "The message would" in res.data

        badhashres = self.client.get(url_for("account.verify", login=oldhash))
        assert "This URL is no longer valid" in badhashres.data, "Old hash should not work"

        goodhash = self.client.post(url_for('account.verify', login=self.user.login_hash), \
                data=dict(loginhash=self.user.login_hash, password1='mypassword', password2='mypassword'), follow_redirects=True)
        print goodhash.data
        assert "Password saved and you are now verified" in goodhash.data, "Success should redirect back to homepage with message"


    def test_trigger_reset_bademail(self):
        """
        bad emails should be redirected back to the same page
        """
        res = self.client.post(url_for("account.trigger_reset"), data=dict(email="notmyemail@nothing.com"), follow_redirects=True)
        assert "No user is registered under this address" in res.data


        
    # to be implemented

    def test_unverified_user(self):
        """
        check that unverified user can't go anywhere

        """
        myfakeuser = make_account(name="tester", fullname='tester',
                    email='tester@test.com',
                    admin=False, verified=False)

        myfakeuser.password = generate_password_hash("mypassword")
        db.session.commit()

        res= self.client.post(url_for('account.login'), 
                            data=dict(login="tester@test.com",
                                        password='mypassword'), follow_redirects=True)
        assert "The message would have been sent below" in res.data, "should show an email message inn debug"

        res2 = self.client.get(url_for("forum.index"))
        assert '403' in res2.status, "should not be able to access the forum as unverified user"


