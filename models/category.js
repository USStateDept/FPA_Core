/**
 * Category Model
 *
 * Find.state.gov indicator model
 * @author Michael Ramos 
 */
'use strict';

module.exports = function(sequelize, DataTypes) {
  var Category = sequelize.define("Category", {
    Category_ID: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    Category_Name: {
        type: DataTypes.STRING
    },
    Sub_Category_Name: {
        type: DataTypes.STRING
    }
  });
  
  return Category;
};















