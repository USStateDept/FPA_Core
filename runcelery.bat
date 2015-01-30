set OPENSPENDING_SETTINGS=%CD%\settings.py

call "pyenv/Scripts/activate.bat"

celery -A openspending.tasks worker -l info

pause