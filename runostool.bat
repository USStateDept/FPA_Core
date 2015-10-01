set OPENSPENDING_SETTINGS=%CD%\settings.py

set PYTHONHOME=
set PYTHONPATH=

call "pyenv/Scripts/activate.bat"

ostool runserver

pause