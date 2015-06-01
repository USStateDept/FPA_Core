

SET BASEDIR=%CD%

cd %BASEDIR%\openspending\static\dataloader\
call npm install 
call bower install
call grunt build --force

cd %BASEDIR%\openspending\static\dataviewer\
call npm install 
call bower install
call grunt build --force

cd %BASEDIR%


