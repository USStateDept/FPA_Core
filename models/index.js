/**
 * Models - Index
 *
 * @desc Index Class, purpose is to setup and sync the models.
 * Executed in the server initiation. Be careful making edits
 * to this file
 * @author Michael Ramos 
 */

"use strict";

var fs        = require("fs");
var path      = require("path");
var Sequelize = require("sequelize");
var env       = process.env.NODE_ENV || "development";


export default class Model {
  constructor(dbconfig){
    this.dbname = dbconfig.name;
    this.dbuser = dbconfig.username;
    this.dbpass = dbconfig.password;
    this.dbsetting = dbconfig.settings;
  }

  init(){

    var sequelize = new Sequelize(this.dbname, this.dbuser, this.dbpass, this.dbsetting);
    var db = {};

    fs
    .readdirSync(__dirname)
    .filter(function(file) {
      return (file.indexOf(".") !== 0) && (file !== "index.js");
    })
    .forEach(function(file) {
      var model = sequelize.import(path.join(__dirname, file));
      db[model.name] = model;
    });

    Object.keys(db).forEach(function(modelName) {
      if ("associate" in db[modelName]) {
        db[modelName].associate(db);
      }
    });

    db.sequelize = sequelize;
    db.Sequelize = Sequelize;

    return db.sequelize.sync();
  }

}






