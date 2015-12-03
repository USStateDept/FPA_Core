/**
 * Indicator Model
 *
 * @desc find.state.gov, indicators, sequelize orm
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
  }, {
    classMethods: {
      // Executed in ./index.js
      associate: function(models) {
        Indicator.belongsToMany(models.Category, {
            through: 'Category_Junction',
            foreignKey: 'Indicator_ID'
        });
        Indicator.belongsToMany(models.Collection, {
            through: 'Collection_Junction',
            foreignKey: 'Indicator_ID'
        });
      }
    }   
  });
  
  return Indicator;
};
