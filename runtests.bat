set OPENSPENDING_SETTINGS=%CD%\test_settings.py


call "pyenv/Scripts/activate.bat"

nosetests

PAUSE
