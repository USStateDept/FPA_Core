
from flask_mail import Message

from openspending.core import mail
from openspending.lib.helpers import url_for

def generate_hashlink(account):
    return url_for('account.verify', login=account.login_hash, _external=True)


def sendhash(account, gettext = False):
    msg = Message(subject="FIND.state.gov Login URL",
              recipients=[account.email],
              body = "You're getting this email because it was entered on FIND.state.gov.  \
              Use the this link to login as a USG user.  \
              This is a private link just for you, so do not forward it.\
              " + generate_hashlink(account))
    if gettext:
        returnobj = {
            "subject": "FIND.state.gov Login URL",
            "recipients":[account.email],
            "body":  "You're getting this email because it was entered on FIND.state.gov.  \
              Use the this link to login as a USG user.  \
              This is a private link just for you, so do not forward it.\
              " + generate_hashlink(account),
            "verifylink": generate_hashlink(account)
        }
        return returnobj
    try:
        mail.send(msg)
    except Exception ,e:
        print "failed to send the message"
        print e