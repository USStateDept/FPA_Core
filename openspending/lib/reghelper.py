
from flask_mail import Message

from openspending.core import mail
from openspending.lib.helpers import url_for

def generate_hashlink(account):
    return url_for('account.verify', login=account.login_hash, _external=True)


def sendhash(account, gettext = False):
    msg = Message(subject="FIND.state.gov Login URL",
              recipients=[account.email],
              body = """You are recieving this email because it was entered on FIND.state.gov to register a new account.  Use the link found below to verify your email address and login to the system.\n\n This is a private link just for you.  Do not forward or share this email.  The link can only be used one time.\n\n
              %s"""%str(generate_hashlink(account)))
    if gettext:
        returnobj = {
            "subject": "FIND.state.gov Login URL",
            "recipients":[account.email],
            "body":  """You are recieving this email because it was entered on FIND.state.gov 
              to register a new account.  Use the link found below to verify your email address and
              login to the system.\n\n    
              This is a private link just for you.  Do not forward or share this email.
              The link can only be used one time.
              %s"""%str(generate_hashlink(account)),
            "verifylink": generate_hashlink(account)
        }
        return returnobj
    try:
        mail.send(msg)
    except Exception ,e:
        log.critical("failed to send the message: %s \n with error: %s"%(account.email, e))

def send_reset_hash(account, gettext=False):
  msg = Message(subject="FIND.state.gov Reset Password URL",
            recipients=[account.email],
            body = """You are recieving this email because it was requested that the password be reset.  If this is incorrect, please email admin@find.state.gov immediately.\n\n This is a private link just for you.  Do not forward or share this email. The link can only be used one time.
              %s"""%str(generate_hashlink(account)))
  if gettext:
      returnobj = {
          "subject": "FIND.state.gov Reset Password URL",
          "recipients":[account.email],
          "body":  """You are recieving this email because it was requested that the password be reset.  If this is incorrect, please email admin@find.state.gov immediately.\n\n  This is a private link just for you.  Do not forward or share this email.  The link can only be used one time. \n\n%s"""%str(generate_hashlink(account)),
          "verifylink": generate_hashlink(account)
      }
      return returnobj
  try:
      mail.send(msg)
  except Exception ,e:
      log.critical("failed to send reset password message: %s \n with error: %s"%(account.email, e))
