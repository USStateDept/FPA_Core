FIND Node.js Application
=============================

Setup
===============

1.  Install node.js and npm if you have not already
2.  Run `npm install -g forever nodemon` to to install global runners for the node app
3.  Run `npm install` to install all dependencies of the project
4.  Run `nodemon -e ".js" app.js` to start the server and watch all js files

**A few notes**
 - The API requires the development.json file in findapi/config/.  There is already a template file in the folder
 - This uses denormalized tables for the dataset.  See https://github.com/USStateDept/FPA_Core/pull/339 for rationale and instructions.  Quick setup, run `pip install -r requirements.txt` and `ostool db denormalize -d` on your flask application


License and Credits
===================

Copyright 2014 [Rick Blalock](https://github.com/rblalock)

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

   [http://www.apache.org/licenses/LICENSE-2.0](http://www.apache.org/licenses/LICENSE-2.0)

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
