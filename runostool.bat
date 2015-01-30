set OPENSPENDING_SETTINGS=%CD%\settings.py


call "pyenv/Scripts/activate.bat"

ostool runserver

pause