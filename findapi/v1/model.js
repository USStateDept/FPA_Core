/**
 * Stubbed model / service layer.
 *
 * This is where you'd handle model logic, mashing together things, or whatever else
 * related to your data.
 *
 * @class Model
 * @version 1
 */
var configpg = require("../config");
//var request = require("request");
var querystring = require("querystring");
var url = require('url');
var _ =  require("underscore");
var moment = require("moment");
var pg = require('pg');
var squel = require("squel");
//(optionally) set the SQL dialect


var config = require("../config").v1;
var connectionString = require("../database").connectionString;



var FORMATOPTS = {'json':true, 'csv':true, 'excel':true, 'xls':true};
var RETURNLIMIT= 10000;
var DEFAULTDRILLDOWN = {"geometry__country_level0":"sovereignt","geometry__time":"time"};


/**
 * The model object
 * @constructor
 */
var DataSource = function(request, rescallback) {
    var that = this;

    this.rescallback = rescallback;

    var url_parts = url.parse(request.url, true);
    var querystring = url_parts.query;

    this.params = {};
    this.cubes = [];
    this.daterange= {"start":null,"end":null};
    this.format='json';
    this.agg = {};
    this.drilldown = {};
    this.cut={};
    this.nulls=true;

    this.dataframe = null;

    this.geomtables = ['geometry__time', 'geometry__country_level0'];

    this.cubes_tables = [];

    this.t = {};

    this.cachedresult = null;

    var connectionString =  configpg.databaseURI || 'postgres://localhost:5432/openspending'


    this.client = new pg.Client(connectionString);

    this.query = function(_query){
        that.client.connect(function(err) {
          if(err) {
            return console.error('could not connect to postgres', err);
          }
          that.client.query(_query, function(err, result) {
            if(err) {
              return console.error('error running query', err);
            }
            if (that.format == "xls" || that.format == "excel"){
                that.get_xls({
                    success: true,
                    rows: result.rows
                });
            }
            else if( that.format == "csv"){
                that.get_csv({
                    success: true,
                    rows: result.rows
                });
            }
            else{
                that.get_json({
                    success: true,
                    rows: result.rows
                });                
            }

            //output: Tue Jan 15 2013 19:12:47 GMT-600 (CST) 
            that.client.end();
          });
        });

    };

    /**
     * Cache instance
     * @type {Object}
     */
    this.cache = require("./cache")(config.cacheEnabled, config.cacheDuration);

    this.parseParams = function(request, _callback){
        console.log(request.query);
        var cubes_arg = request.query['cubes'];
        if (! cubes_arg){
            console.log("No cube passed");
            return null;
        }

        that.cubes = cubes_arg.split("|");
        that.cubes_tables = {}
        _.each(that.cubes, function(elem, index){
            that.cubes_tables[elem] = elem + "__denorm"
        });

        if (that.cubes.length > 5){
            console.log("Can only join up to 5 cubes");
            return null;
        }   


        var dateparam = request.query['daterange'];
        if (dateparam){
            var datesplit = dateparam.split("-")
            if (datesplit.length == 1){
                that.daterange['start'] = parseInt(datesplit[0]);
            }
            else if( datesplit.length == 2){
                that.daterange['start'] = parseInt(datesplit[0]);
                if (that.daterange['start']){
                    that.daterange['end'] = parseInt(datesplit[1])
                }
            }
        }


        var tempformat = request.query['format'];
        if (tempformat){
            if (FORMATOPTS[tempformat.toLowerCase()]){
                that.format = tempformat.toLowerCase()
            } 
            else{
                that.format = 'json'
            }
        }


        //parse cut
        //cut=geometry__country_level0@name:albania;argentina;australia;azerbaijan
        var tempcuts = request.query['cut'];
        if (tempcuts){
            var cutsplit = tempcuts.split("|")
            _.each(cutsplit, function(tempcut, index){
                var basenamesplit = tempcut.split(":")
                var name = basenamesplit[0]
                var values = basenamesplit[1].split(';')

                var cutter = name.split("@");
                console.log(cutter);
                if (cutter.length > 1){
                    if (that.cut[cutter[0]]){
                        that.cut[cutter[0]][cutter[1]] = values;
                    }
                    else{
                        console.log(cutter);
                        //that.cut[cutter[0]] = { cutter[1] : values };
                    }
                }
                else{
                    if (that.cut[cutter[0]]){
                        that.cut[cutter[0]][DEFAULTDRILLDOWN[cutter[0]]] = values;
                    }
                    else{
                        console.log(cutter);
                        //that.cut[cutter[0]] = {DEFAULTDRILLDOWN[cutter[0]]:values};
                    }
                }
            });               
        }


        var tempdrilldown = request.query["drilldown"];
        if (tempdrilldown){
            var drilldownsplit = tempdrilldown.split("|");
            _.each(drilldownsplit, function(tempdrill){
                var dd = tempdrill.split("@");
                if (dd.length > 1){
                    if (that.drilldown[dd[0]]){
                        that.drilldown[dd[0]].push(dd[1])
                    }
                    else{
                        that.drilldown[dd[0]] = [dd[1]];
                    }
                }
                else{
                    if (that.drilldown[dd[0]]){
                        that.drilldown[dd[0]].push(DEFAULTDRILLDOWN[dd[0]]);
                    }
                    else{
                        that.drilldown[dd[0]] = [DEFAULTDRILLDOWN[dd[0]]];
                    }
                }
            });
              
        }

        that.nulls = request.query['nulls'];


        that.clusterparams = {
            "cluster": request.query["cluster"],
            "clusternum": request.query["clusternum"]
        }
        return that.buildQuery();
    };

    this.buildQuery = function(){
        that.primary_table = _.values(that.cubes_tables)[0];

        that.selectable = squel.select()
            .from("finddata." + that.primary_table + " AS " + that.primary_table)
            .field("COUNT(" + that.primary_table + ".geom_time_id)", "count")
            .field("AVG(" + that.primary_table + ".amount)", that.primary_table + "__avg")
            .field("MAX(" + that.primary_table + ".amount)", that.primary_table + "__max")
            .field("MIN(" + that.primary_table + ".amount)", that.primary_table + "__min");

        _.each(that.cubes_tables, function(cubes_ts, index){
            if (cubes_ts == that.primary_table){
                return;
            }
            that.selectable = that.selectable
                .outer_join("finddata." + cubes_ts + " AS " + cubes_ts, null, cubes_ts + ".geom_time_id = "+ that.primary_table  + ".geom_time_id")
                .field("AVG(" + cubes_ts + ".amount)", that.primary_table + "__avg")
                .field("MAX(" + cubes_ts + ".amount)", that.primary_table + "__max")
                .field("MIN(" + cubes_ts + ".amount)", that.primary_table + "__min");
        });

        _.each(that.drilldown, function(drilldowns, tablename){
            _.each(drilldowns, function(dd,index){
                if (tablename == "geometry__country_level0"){
                    that.selectable = that.selectable
                                            .field(that.primary_table + "." + dd, "geo__" + dd)
                                            .group(that.primary_table + "." + dd);
                }
                else if (tablename == "geometry__time"){
                    that.selectable = that.selectable
                                            .field(that.primary_table + ".time", "time")
                                            .group(that.primary_table + ".time");

                }
                else{

                }
            });
        });

        _.each(that.cut, function(cols, table_name){
            _.each(cols, function(values, colname){
                if (_.has(['geometry__country_level0', 'geometry__time'], table_name)){
                    table_name = that.primary_table
                }
                that.selectable = that.selectable.where(that.primary_table + "." + colname + " IN (" + values.join(",") + ")");
            });
        });

        if (that.daterange['start']){
            that.selectable = that.selectable.where(that.primary_table + ".time >= " + that.daterange['start']);
        }

        if (that.daterange['end']){
            that.selectable = that.selectable.where(that.primary_table + ".time <= " + that.daterange['end']);
        }


    
        if (!that.nulls){
            _.each(that.cubes_tables, function(cube_tb){ 
                that.selectable = that.selectable.where(cube_tb + ".amount IS NOT NULL");
            });
        }

        return that.get_response();




    };

    this.get_response = function(){
        console.log(that.selectable.toString());
        return that.query(that.selectable.toString());

    };

    this.get_json= function(result){
        var response= {};
        response['cells'] = result['rows'];
        that.rescallback(response);

    };

    this.get_xls = function(){

    };

    this.get_csv = function(){

    };

    return this.parseParams(request);



}


module.exports = function(request, rescallback) {
    return new DataSource(request, rescallback);
};