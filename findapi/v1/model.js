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
var calculateJenks = require("./jenks").calculateJenks;
var errorHandling = require("./errorHandling");
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
var DataSource = function(request, response, rescallback) {
    var that = this;

    this.response = response;

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
    this.client.connect(function(err){
        if (err){
            errorHandling.handle("There was an error with the database: " + err, that.response);
            console.log("could not connect to postgres");
            console.log(err);
        }
    });

    this.query = function(_query, callback){

      that.client.query(_query, function(err, result) {
        if(err) {
            errorHandling.handle("Error on query: " + err + "\n" + _query, that.response);
            console.log("Error on query: " + err + "\n" + _query);
            return null;
        }
        callback({
            "success": true,
            "rows": result.rows
        });

      });


    };

    this.tearDown = function(){
        that.client.end();
    };

    /**
     * Cache instance
     * @type {Object}
     */
    this.cache = require("./cache")(config.cacheEnabled, config.cacheDuration);

    this.parseParams = function(request, _callback){
        var cubes_arg = request.query['cubes'];
        if (! cubes_arg){
            errorHandling.handle("No data to fetch, no cubes argument", that.response);
            console.log("No data to fetch, no cubes argument");
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

                if (cutter.length > 1){
                    if (that.cut[cutter[0]]){
                        that.cut[cutter[0]][cutter[1]] = values;
                    }
                    else{
                        that.cut[cutter[0]] = {};
                        that.cut[cutter[0]][cutter[1]] = values;
                    }
                }
                else{
                    if (that.cut[cutter[0]]){
                        that.cut[cutter[0]][DEFAULTDRILLDOWN[cutter[0]]] = values;
                    }
                    else{
                        var tempobj= DEFAULTDRILLDOWN[cutter[0]];
                        that.cut[cutter[0]] = { tempobj : values };
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
        that.primary_base = that.primary_table.split("__")[0];
        that.selectable = squel.select()
            .from("finddata." + that.primary_table + " AS " + that.primary_table)
            .field("COUNT(" + that.primary_table + ".geom_time_id)", "count")
            .field("AVG(" + that.primary_table + ".amount)", that.primary_base + "__avg")
            .field("MAX(" + that.primary_table + ".amount)", that.primary_base + "__max")
            .field("MIN(" + that.primary_table + ".amount)", that.primary_base + "__min");

        _.each(that.cubes_tables, function(cubes_ts, index){
            if (cubes_ts == that.primary_table){
                return;
            }
            var tempcube_base = cubes_ts.split("__")[0]
            that.selectable = that.selectable
                .right_join("finddata." + cubes_ts + " AS " + cubes_ts, null, cubes_ts + ".geom_time_id = "+ that.primary_table  + ".geom_time_id")
                .field("AVG(" + cubes_ts + ".amount)", tempcube_base + "__avg")
                .field("MAX(" + cubes_ts + ".amount)", tempcube_base + "__max")
                .field("MIN(" + cubes_ts + ".amount)", tempcube_base + "__min");
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
                                            .group(that.primary_table + ".time")
                                            .order("time");

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
                if (values.length > 0){
                    that.selectable = that.selectable.where(that.primary_table + "." + colname + " IN ('" + values.join("','") + "')");
                }
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
        //console.log(that.selectable.toString());
        var callback = null;
        if (that.format == "xls" || that.format == "excel"){
            callback = that.get_xls;
        }
        else if( that.format == "csv"){
            callback = that.get_csv;
        }
        else{
            callback = that.get_json;
        }
        return that.query(that.selectable.toString(), callback);

    };

    this.get_json= function(result){
        var response= {};
        response['cells'] = result['rows'];
        that.get_dataset_metadata(function(rowresult){
            response['models'] = _.map(rowresult.rows, function(d){
                d.years= _.sortBy(d.years.split(","), function(val){
                    return +val;
                });
                return d;
            });
            if (that.clusterparams['cluster'] == 'jenks'){
                that.calculate_clusters(response);
            }
            else{
                that.rescallback(response);
            }
        });
        //response['models'] = that.get_dataset_metadata();


    };

    this.get_xls = function(){

    };

    this.get_csv = function(){

    };



    this.get_dataset_metadata = function(callback){
        var sqlstatement = squel.select()
             .from("public.dataset")
             .field("label")
             .field("description")
             .field('"dataType"')
             .field("created_at")
             .field('name')
             .field('units')
             .field('years')
             .where("name IN  (?)", that.cubes.join("','")).toString();
        that.query(sqlstatement, function(query_result){
            callback(query_result);
        });
    };

    this.calculate_clusters = function(response){
        var clusternum = that.clusterparams.numclusters;

        if (! clusternum){
            clusternum = 5;
        }

        var dataitem = response['cells'].map(function(d) { return+d[that.primary_table.split("__")[0] + "__avg"]; });

        if (dataitem.length <= clusternum){
            clusternum = dataitem.length;
        }

        var clusters = calculateJenks(dataitem, clusternum);

        var labels= [];
        _.each(clusters, function(val, index, list){
            if (index >= list.length -1){
                return false;
            }
            labels.push(val + "-" + list[index+1])
        });
        response['cluster'] = {
            'data': clusters,
            'labels': labels
        };

        that.rescallback(response);
    }

    return this.parseParams(request);



}


module.exports = function(request, response, rescallback) {
    return new DataSource(request, response, rescallback);
};