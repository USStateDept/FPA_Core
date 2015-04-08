



cd %CD%\openspending\static\dataloader\
call npm install 
call bower install
call grunt build

cd %CD%\openspending\static\dataviewer\
call npm install 
call bower install
call grunt build

cd %CD%\openspending\static\viz\
call bower install


