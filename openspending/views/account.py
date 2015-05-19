import colander
from flask import Blueprint, render_template, request, redirect
from flask.ext.login import current_user, login_user, logout_user
from flask import current_app
from sqlalchemy.sql.expression import desc, func, or_
from werkzeug.security import check_password_hash, generate_password_hash

from openspending.core import db, login_manager
from openspending.auth import require
from openspending.model.dataset import Dataset
from openspending.model.account import (Account, AccountRegister,
                                        AccountSettings)
from openspending.lib.paramparser import DistinctParamParser
from openspending.lib.mailman import subscribe_lists
from openspending.lib.jsonexport import jsonify
from openspending.lib.mailer import send_reset_link
from openspending.lib.helpers import url_for, obj_or_404
from openspending.lib.helpers import flash_error
from openspending.lib.helpers import flash_notice, flash_success
from openspending.lib.pagination import Page
from openspending.lib.reghelper import sendhash
from openspending.views.cache import disable_cache




from wtforms import Form, TextField, PasswordField, validators



blueprint = Blueprint('account', __name__)


@login_manager.request_loader
def load_user_from_request(request):
    api_key = request.args.get('api_key')
    if api_key and len(api_key):
        account = Account.by_api_key(api_key)
        if account:
            return account

    api_key = request.headers.get('Authorization')
    if api_key and len(api_key) and ' ' in api_key:
        method, api_key = api_key.split(' ', 1)
        if method.lower() == 'apikey':
            account = Account.by_api_key(api_key)
            if account:
                return account
    return None


@blueprint.route('/login', methods=['GET'])
def login():
    """ Render the login/registration page. """
    disable_cache()
    return render_template('account/login.jade')


@blueprint.route('/login', methods=['POST', 'PUT'])
def login_perform():
    account = Account.by_email(request.form.get('login'))
    #if account is not None and account.verified == True:
    if account is not None:
        if check_password_hash(account.password, request.form.get('password')):
            logout_user()
            login_user(account, remember=True)
            flash_success("Welcome back, " + account.fullname + "!")
            return redirect(url_for('home.index'))
    flash_error(_("Incorrect user name or password!"))
    return login()


@blueprint.route('/register', methods=['POST', 'PUT'])
def register():
    """ Perform registration of a new user """
    disable_cache()
    errors, values = {}, dict(request.form.items())

    try:
        # Grab the actual data and validate it
        data = AccountRegister().deserialize(values)

        #check if email is already registered
            # it is, then send the email hash for the login

        #check that email is real
        #get the domain
        print data['email']
        if (data['email'].find('@') == -1 or data['email'].find('.') == -1):
            raise colander.Invalid(AccountRegister.email,
                    "You must use a valid USG email address")

        domain = data['email'][data['email'].find('@') + 1:]

        if 'EMAIL_WHITELIST' not in current_app.config.keys():
            raise colander.Invalid(AccountRegister.email,
                "System not set correctly.  Please contact the administrator.")

        domainvalid = False

        for domainemail in current_app.config['EMAIL_WHITELIST']:
            if domain.lower() == domainemail.lower():
                domainvalid = True

        if not domainvalid:
            raise colander.Invalid(AccountRegister.email,
                "Your email is not available for registration.  Currently it is only available for US Government emails.")



        # Check if the username already exists, return an error if so
        if Account.by_email(data['email']):
            #resend the hash here to the email and notify the user
            raise colander.Invalid(
                AccountRegister.email,
                _("Login email already exists, please choose a "
                  "different one"))

        # Check if passwords match, return error if not
        if not data['password1'] == data['password2']:
            raise colander.Invalid(AccountRegister.password1,
                                   "Passwords don't match!")

        # Create the account
        account = Account()
        account.fullname = data['fullname']
        account.email = data['email']
        account.password = generate_password_hash(data['password1'])

        db.session.add(account)
        db.session.commit()

        # Perform a login for the user
        #login_user(account, remember=True)

        sendhash(account)


        # TO DO redirect to email sent page
        return redirect(url_for('account.email_message', id=account.id))
    except colander.Invalid as i:
        errors = i.asdict()
    return render_template('account/login.jade', form_fill=values,
                           form_errors=errors)


@blueprint.route('/accounts/verify', methods=['GET'])
def verify():
    disable_cache()

    loginhash = request.args.get('login')
    if not loginhash:
        message = "We cannot find your unique URL"
        return render_template('account/email_message.jade', message=message)

    account = Account.by_login_hash(loginhash)

    if not account:
        message = "We could not find your account"
        return render_template('account/email_message.jade', message=message)
    
    #update to verify this user so they can 
    #use the password in the future
    account.verified = True
    db.session.commit()


    flash_success("You are now logged in")
    login_user(account, remember=True)



    return redirect(url_for('home.index'))



@blueprint.route('/accounts/email_message', methods=['GET'])
def email_message():
    disable_cache()

    user_id = request.args.get('id')

    useraccount = Account.by_id(user_id)

    if not useraccount:
        message = "There is no user with this account"
        return render_template('account/email_message.jade', message=message)

    if useraccount.verified or useraccount.admin:
        message = "This Account is already verified or is an administrator of the system.  This operation is not possible."
        return render_template('account/email_message.jade', message=message)

    message_dict = sendhash(useraccount, gettext=True)
    message = str(message_dict) + "<br/><br/><a href='" + message_dict['verifylink'] + "'><h3>Click to Verify</h3></a>"

    return render_template('account/email_message.jade', message=message)





@blueprint.route('/logout')
def logout():
    disable_cache()
    logout_user()
    flash_success("You have been logged out.")
    return redirect(url_for('home.index'))







########################### OPENSPENDING ROUTES TO BE USED OR REMOVED################



@blueprint.route('/settings')
def settings():
    """ Change settings for the logged in user """
    disable_cache()
    require.account.update(current_user)
    values = current_user.as_dict()
    if current_user.public_email:
        values['public_email'] = current_user.public_email
    if current_user.public_twitter:
        values['public_twitter'] = current_user.public_twitter
    values['api_key'] = current_user.api_key
    return render_template('account/settings.html',
                           form_fill=values)


@blueprint.route('/settings', methods=['POST', 'PUT'])
def settings_save():
    """ Change settings for the logged in user """
    require.account.update(current_user)
    errors, values = {}, dict(request.form.items())

    try:
        data = AccountSettings().deserialize(values)

        # If the passwords don't match we notify the user
        if not data['password1'] == data['password2']:
            raise colander.Invalid(AccountSettings.password1,
                                   _("Passwords don't match!"))

        current_user.fullname = data['fullname']
        current_user.email = data['email']
        current_user.public_email = data['public_email']
        if data['twitter'] is not None:
            current_user.twitter_handle = data['twitter'].lstrip('@')
            current_user.public_twitter = data['public_twitter']

        # If a new password was provided we update it as well
        if data['password1'] is not None and len(data['password1']):
            current_user.password = generate_password_hash(
                data['password1'])

        # Do the actual update in the database
        db.session.add(current_user)
        db.session.commit()

        # Let the user know we've updated successfully
        flash_success(_("Your settings have been updated."))
    except colander.Invalid as i:
        # Load errors if we get here
        errors = i.asdict()

    return render_template('account/settings.html',
                           form_fill=values,
                           form_errors=errors)


@blueprint.route('/dashboard')
def dashboard(format='html'):
    """
    Show the user profile for the logged in user
    """
    disable_cache()
    require.account.logged_in()
    print current_user
    return profile(current_user.fullname)


@blueprint.route('/scoreboard')
def scoreboard(format='html'):
    """
    A list of users ordered by their score. The score is computed by
    by assigning every dataset a score (10 divided by no. of maintainers)
    and then adding that score up for all maintainers.

    This does give users who maintain a single dataset a higher score than
    those who are a part of a maintenance team, which is not really what
    we want (since that rewards single points of failure in the system).

    But this is an adequate initial score and this will only be accessible
    to administrators (who may be interested in findin these single points
    of failures).
    """
    require.account.is_admin()

    # Assign scores to each dataset based on number of maintainers
    score = db.session.query(Dataset.id,
                             (10 / func.count(Account.id)).label('sum'))
    score = score.join('managers').group_by(Dataset.id).subquery()

    # Order users based on their score which is the sum of the dataset
    # scores they maintain
    user_score = db.session.query(
        Account.name, Account.email,
        func.coalesce(func.sum(score.c.sum), 0).label('score'))
    user_score = user_score.outerjoin(Account.datasets).outerjoin(score)
    user_score = user_score.group_by(Account.name, Account.email)
    # We exclude the system user
    user_score = user_score.filter(Account.name != 'system')
    user_score = user_score.order_by(desc('score'))

    # Fetch all and assign to a context variable score and paginate them
    # We paginate 42 users per page, just because that's an awesome number
    scores = user_score.all()
    page = Page(scores, items_per_page=42,
                item_count=len(scores),
                **dict(request.args.items()))

    return render_template('account/scoreboard.html', page=page)


@blueprint.route('/accounts/_complete')
def complete(format='json'):
    disable_cache()
    parser = DistinctParamParser(request.args)
    params, errors = parser.parse()
    if errors:
        return jsonify({'errors': errors}, status=400)
    if not current_user.is_authenticated():
        msg = _("You are not authorized to see that page")
        return jsonify({'errors': msg}, status=403)

    query = db.session.query(Account)
    filter_string = params.get('q') + '%'
    query = query.filter(or_(Account.name.ilike(filter_string),
                             Account.fullname.ilike(filter_string)))
    count = query.count()
    query = query.limit(params.get('pagesize'))
    query = query.offset(int((params.get('page') - 1) *
                             params.get('pagesize')))
    results = [dict(fullname=x.fullname, name=x.name) for x in list(query)]

    return jsonify({
        'results': results,
        'count': count
    })




#TODO send a new hash to this user
@blueprint.route('/account/forgotten', methods=['POST', 'GET'])
def trigger_reset():
    """
    Allow user to trigger a reset of the password in case they forget it
    """
    disable_cache()
    # If it's a simple GET method we return the form
    if request.method == 'GET':
        return render_template('account/trigger_reset.html')

    # Get the email
    email = request.form.get('email')

    # Simple check to see if the email was provided. Flash error if not
    if email is None or not len(email):
        flash_error(_("Please enter an email address!"))
        return render_template('account/trigger_reset.html')

    # Get the account for this email
    account = Account.by_email(email)

    # If no account is found we let the user know that it's not registered
    if account is None:
        flash_error(_("No user is registered under this address!"))
        return render_template('account/trigger_reset.html')

    # Send the reset link to the email of this account
    send_reset_link(account)

    # Let the user know that email with link has been sent
    flash_success(_("You've received an email with a link to reset your "
                    "password. Please check your inbox."))

    # Redirect to the login page
    return redirect(url_for('account.login'))


@blueprint.route('/account/reset')
def do_reset():
    email = request.args.get('email')
    if email is None or not len(email):
        flash_error(_("The reset link is invalid!"))
        return redirect(url_for('account.login'))

    account = Account.by_email(email)
    if account is None:
        flash_error(_("No user is registered under this address!"))
        return redirect(url_for('account.login'))

    if request.args.get('token') != account.token:
        flash_error(_("The reset link is invalid!"))
        return redirect(url_for('account.login'))

    login_user(account)
    flash_success(
        _("Thanks! You have now been signed in - please change "
                + "your password!"))
    return redirect(url_for('account.settings'))


@blueprint.route('/account/<pk_id>')
def profile(pk_id):
    """ Generate a profile page for a user (from the provided name) """

    # Get the account, if it's none we return a 404
    profile = obj_or_404(Account.by_id(pk_id))

    # Set a context boo if email/twitter should be shown, it is only shown
    # to administrators and to owner (account is same as context account)
    show_info = (current_user and current_user.admin) or \
                (current_user == profile)


    # Collect and sort the account's datasets and views
    #profile_datasets = sorted(profile.datasets, key=lambda d: d.label)
    #profile_views = sorted(profile.views, key=lambda d: d.label)

    # Render the profile
    return render_template('account/profile.html', profile=profile)
