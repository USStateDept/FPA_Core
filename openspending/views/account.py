import colander
from flask import Blueprint, render_template, request, redirect
from flask.ext.login import current_user, login_user, logout_user
from flask import current_app
from werkzeug.security import check_password_hash, generate_password_hash

from openspending.core import db, login_manager
from openspending.auth import require
#from openspending.model.dataset import Dataset
from openspending.model.account import (Account, AccountRegister,
                                        AccountSettings)
from openspending.lib.helpers import url_for, obj_or_404
from openspending.lib.helpers import flash_error
from openspending.lib.helpers import flash_notice, flash_success
from openspending.lib.reghelper import sendhash
from openspending.views.context import generate_csrf_token


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
    values = {"csrf_token": generate_csrf_token()}
    return render_template('account/login.jade', form_fill=values)


@blueprint.route('/login', methods=['POST', 'PUT'])
def login_perform():
    account = Account.by_email(request.form.get('login'))
    if account is not None and not account.verified:
        return redirect(url_for('account.email_message', id=account.id))
    #if account is not None and account.verified == True:
    if account is not None:
        if check_password_hash(account.password, request.form.get('password')):
            logout_user()
            login_user(account, remember=True)
            flash_success("Welcome back, " + account.fullname + "!")
            return redirect(url_for('home.index'))
    flash_error("Incorrect user name or password!")
    return login()


@blueprint.route('/register', methods=['POST', 'PUT'])
def register():
    """ Perform registration of a new user """
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
            flash_error("You must use a valid USG email address")
            raise colander.Invalid(AccountRegister.email,
                    "You must use a valid USG email address")

        domain = data['email'][data['email'].find('@') + 1:]

        if 'EMAIL_WHITELIST' not in current_app.config.keys():
            flash_error("Your email is not current supported.  The login option is only available for US Government offices at this time.")
            raise colander.Invalid(AccountRegister.email,
                "System not set correctly.  Please contact the administrator.")

        domainvalid = False

        for domainemail in current_app.config['EMAIL_WHITELIST']:
            if domain.lower() == domainemail.lower():
                domainvalid = True

        if not domainvalid:
            flash_error("Your email is not current supported.  The login option is only available for US Government offices at this time.")
            raise colander.Invalid(AccountRegister.email,
                "Your email is not available for registration.  Currently it is only available for US Government emails.")



        # Check if the username already exists, return an error if so
        if Account.by_email(data['email']):
            flash_error("Login Name already exists.  Click reset password.")

            #resend the hash here to the email and notify the user
            raise colander.Invalid(
                AccountRegister.email,
                "Login Name already exists.  Click reset password.")



        # Create the account
        account = Account()
        account.fullname = data['fullname']
        account.email = data['email']
        

        db.session.add(account)
        db.session.commit()

        # Perform a login for the user
        #login_user(account, remember=True)

        sendhash(account)


        # TO DO redirect to email sent page
        return redirect(url_for('account.email_message', id=account.id))
    except colander.Invalid as i:
        errors = i.asdict()
    if request.form.get("csrf_token",None):
        values['csrf_token'] = request.form.get('csrf_token')
    else:
        values["csrf_token"] = generate_csrf_token()
    return render_template('account/login.jade', form_fill=values,
                           form_errors=errors)


@blueprint.route('/account/verify', methods=['POST', 'GET'])
def verify():


    if request.method == 'GET':
        loginhash = request.args.get('login')
        if not loginhash:
            message = "Invalid URL.  Please contact system administrator."
            return render_template('account/message.jade', message=message)


        account = Account.by_login_hash(loginhash)

        if not account:
            message = "This URL is no longer valid.  If you have an account, you can reset your password at the " + \
                        " <a href='" + url_for('account.trigger_reset') + "'>password reset page</a>. Or you can register at \
                        <a href='" + url_for('account.login') + "'>login page</a>"
            return render_template('account/message.jade', message=message)

    
        #request.form.loginhash = {"data":loginhash}
        if request.form.get("csrf_token",None):
            values = {'loginhash': loginhash, 
                        "csrf_token": request.form.get('csrf_token')}
        else:
            values = {'loginhash': loginhash, 
                    "csrf_token": generate_csrf_token()}
        return render_template('account/verify.jade',
                account=account, 
                form_fill=values)

    else:
        loginhash = request.form.get('loginhash')
        if not loginhash:
            message = "We cannot find your unique URL"
            return render_template('account/message.jade', message=message)

        account = Account.by_login_hash(loginhash)

        if not account:
            message = "We could not find your account"
            return render_template('account/message.jade', message=message)

        password1 = request.form.get('password1')
        password2 = request.form.get('password2')

        # Check if passwords match, return error if not
        if password1 != password2:
            error = "Your passwords do not match"
            values = {'loginhash': loginhash, 
                        "csrf_token": request.form.get('csrf_token')}

            return render_template('account/verify.jade', 
                loginhash=loginhash, 
                account=account, 
                error=error,
                form_fill=values)

        account.password = generate_password_hash(password1)
        #reset that hash but don't send it.
        account.reset_loginhash()
        account.verified = True
        db.session.commit()


        flash_success("Password saved and you are now verified.  Thank you.")
        login_user(account, remember=True)





        return redirect(url_for('home.index'))




#Developemnt and beta only
@blueprint.route('/accounts/email_message', methods=['GET'])
def email_message():

    user_id = request.args.get('id')

    useraccount = Account.by_id(user_id)

    if not useraccount:
        message = "There is no user with this account"
        return render_template('account/email_message.jade', message=message)

    if useraccount.admin:
        message = "This operation is not possible for this user type"
        return render_template('account/email_message.jade', message=message)

    message_dict = sendhash(useraccount, gettext=True)
    message = str(message_dict) + "<br/><br/><a href='" + message_dict['verifylink'] + "'><h3>Click to Verify</h3></a>"

    return render_template('account/email_message.jade', message=message)





@blueprint.route('/logout')
def logout():
    logout_user()
    flash_success("You have been logged out.")
    return redirect(url_for('home.index'))




#TODO send a new hash to this user
@blueprint.route('/account/forgotten', methods=['POST', 'GET'])
def trigger_reset():
    """
    Allow user to trigger a reset of the password in case they forget it
    """

    values = {"csrf_token": generate_csrf_token()}

    # If it's a simple GET method we return the form
    if request.method == 'GET':
        return render_template('account/trigger_reset.html', form_fill=values)

    # Get the email
    email = request.form.get('email')

    # Simple check to see if the email was provided. Flash error if not
    if email is None or not len(email):
        flash_error("Please enter an email address!")
        return render_template('account/trigger_reset.html',  form_fill=values)

    # Get the account for this email
    account = Account.by_email(email)

    # If no account is found we let the user know that it's not registered
    if account is None:
        flash_error("No user is registered under this address!")
        return render_template('account/trigger_reset.html',  form_fill=values)

    account.reset_loginhash()
    db.session.commit()



    # Send the reset link to the email of this account
    sendhash(account)


    # Redirect to the login page
    return redirect(url_for('account.email_message', id=account.id))


