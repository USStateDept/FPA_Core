/**
 * Country Model
 *
 * @desc find.state.gov, countries, sequelize orm
 * @author Michael Ramos 
 */
'use strict';

module.exports = function(sequelize, DataTypes) {
  var Country = sequelize.define("Country", {
    Country_ID: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    Country_Name: {
      type: DataTypes.STRING
    },
    Continent: {
      type: DataTypes.STRING
    },
    DOD_Gorup: {
      type: DataTypes.STRING
    },
    DOS_Group: {
      type: DataTypes.STRING
    },
    USAID_Group: {
      type: DataTypes.STRING
    },
    INCOME_Group: {
      type: DataTypes.STRING
    },
    Country_Geography: {
      type: DataTypes.GEOMETRY('MULTIPOLYGON')
    }
  }, {
    classMethods: {
      // Executed in ./index.js
      associate: function(models) {
        Country.hasMany(models.Country_Altname, {
          foreignKey: 'Country_ID'
        });
      }
    }
  });

  return Country;
};