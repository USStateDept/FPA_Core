from flask import current_app
from flask.ext.mail import Message

from openspending.core import mail
from openspending.lib.helpers import url_for





def mail_account(recipient, subject, body, headers=None):
    site_title = current_app.config.get('SITE_TITLE')
    
    if (recipient.email is not None) and len(recipient.email):
        msg = Message(subject, recipients=[recipient.email])
        msg.body = None
        mail.send(msg)


def get_reset_body(account):
    reset_link = url_for('account.do_reset',
                         email=account.email,
                         token=account.token)
    d = {
        'reset_link': reset_link,
        'site_title': current_app.config.get('SITE_TITLE')
    }
    return "reset link"


def send_reset_link(account):
    body = get_reset_body(account)
    mail_account(account, 'Reset your password', body)
