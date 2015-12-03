/**
 * Collection Model
 *
 * @desc find.state.gov, collections, sequelize orm
 * @author Michael Ramos 
 */
'use strict';

module.exports = function(sequelize, DataTypes) {
  var Collection = sequelize.define("Collection", {
    Collection_ID: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    Collection_Name: {
        type: DataTypes.STRING
    }
  }, {
    classMethods: {
      // Executed in ./index.js
      associate: function(models) {
        Collection.belongsToMany(models.Indicator, {
            through: 'Collection_Junction',
            foreignKey: 'Collection_ID'
        });
      }
    }   
  });
  
  return Collection;
};