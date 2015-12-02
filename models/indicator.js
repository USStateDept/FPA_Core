/**
 * Category Model
 *
 * Find.state.gov indicator model
 * @author Michael Ramos 
 */
'use strict';

module.exports = function(sequelize, DataTypes) {
  var Indicator = sequelize.define("Indicator", {
    Indicator_ID: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    Indicator_Name: {
        type: DataTypes.STRING
    },
    Indicator_URL: {
        type: DataTypes.STRING
    },
    Direct_Indicator_URL: {
        type: DataTypes.STRING
    },
    Original_Indicator_URL: {
        type: DataTypes.STRING
    },
    Indicator_Definition: {
        type: DataTypes.TEXT
    },
    
  });
  
  return Indicator;
};
