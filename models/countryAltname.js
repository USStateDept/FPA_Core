/**
 * Country Altname Model
 *
 * @desc find.state.gov, country altnames, sequelize orm
 * @author Michael Ramos 
 */
'use strict';

module.exports = function(sequelize, DataTypes) {
    var Country_Altname = sequelize.define("Country_Altname", {
      Country_Altname_ID: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      Altname: {
        type: DataTypes.STRING
      }
    }, {
    classMethods: {
      // Executed in ./index.js
      associate: function(models) {
        Country_Altname.belongsTo(models.Country, {
            foreignKey: 'Country_ID'
        });
      }
    }   
  });
  
  return Country_Altname;
};

