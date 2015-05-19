# -*- coding: utf-8 -*-
"""
Created on Thu Mar 29 09:32:45 2012

@author: hilbert.34
"""

import smtpd
import asyncore

class FakeSMTPServer(smtpd.SMTPServer):
    """A Fake smtp server"""

    def __init__(*args, **kwargs):
        print "Running fake smtp server on port 25"
        print "Check emaillog.log for email messages"
        smtpd.SMTPServer.__init__(*args, **kwargs)

    def process_message(*args, **kwargs):
        fromaddress = args[2]
        messagebody = args[4]
        
        try:
            f = open('emaillog.log', 'a')
        except:
            f = open('emaillog.log', 'w')
        f.write("/************************************/\n")
        f.write(fromaddress + "\n")
        f.write(messagebody + "\n")
        pass

if __name__ == "__main__":
    smtp_server = FakeSMTPServer(('localhost', 25), None)
    try:
        asyncore.loop()
    except KeyboardInterrupt:
        smtp_server.close()