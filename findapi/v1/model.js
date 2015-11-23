/**
 * Stubbed model / service layer.
 *
 * This is where you'd handle model logic, mashing together things, or whatever else
 * related to your data.
 *
 * @class Model
 * @version 1.1.0
 */
var configpg = require("config");
var querystring = require("querystring");
var url = require('url');
var _ =  require("underscore");
var moment = require("moment");
var pg = require('pg');
var squel = require("squel");
var calculateJenks = require("./jenks").calculateJenks;
var errorHandling = require("./errorHandling");
var nodeExcel = require('excel-export');
var csv = require('express-csv')

// Database config
var config = require("config").get("v1");
var connectionString = require("../database").connectionString;

// Data return variables
var FORMATOPTS = {'json':true, 'csv':true, 'excel':true, 'xls':true};
var RETURNLIMIT= 10000;
var DEFAULTDRILLDOWN = {"geometry__country_level0":"sovereignt","geometry__time":"time"};


/**
 * The model object
 * @constructor
 */
var DataSource = function(request, response, rescallback) {
    
    var self = this;

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

    var connectionString =  configpg.get("databaseURI") || 'postgres://localhost:5432/openspending';
    this.client = new pg.Client(connectionString);
    
    this.client.connect(function(err) {
        if (err) {
            errorHandling.handle("There was an error with the database: " + err, self.response);
            console.log("could not connect to postgres");
            console.log(err);
        }
    });

    /**
     *
     *
     */
    this.query = function(_query, callback) {

      self.client.query(_query, function(err, result) {
        if(err) {
            errorHandling.handle("Error on query: " + err + "\n" + _query, self.response);
            console.log("Error on query: " + err + "\n" + _query);
            return null;
        }
        callback({
            "success": true,
            "rows": result.rows
        });

      });

    };

    /**
     *
     *
     */
    this.tearDown = function() {
        self.client.end();
    };

    /**
     * Cache instance
     * @type {Object}
     */
    this.cache = require("./cache")(config.cacheEnabled, config.cacheDuration);

    /**
     *
     *
     */
    this.parseParams = function(request, _callback) {
        var cubes_arg = request.query['cubes'];
        if (! cubes_arg) {
            errorHandling.handle("No data to fetch, no cubes argument", self.response);
            console.log("No data to fetch, no cubes argument");
            return null;
        }

        self.cubes = cubes_arg.split("|");
        self.cubes_tables = {}
        _.each(self.cubes, function(elem, index) {
            self.cubes_tables[elem] = elem + "__denorm"
        });

        if (self.cubes.length > 5) {
            console.log("Can only join up to 5 cubes");
            return null;
        }   

        var dateparam = request.query['daterange'];
       
        if (dateparam) {
            var datesplit = dateparam.split("-")
            if (datesplit.length == 1){
                self.daterange['start'] = parseInt(datesplit[0]);
            } else if( datesplit.length == 2) {
                self.daterange['start'] = parseInt(datesplit[0]);
                if (self.daterange['start']) {
                    self.daterange['end'] = parseInt(datesplit[1])
                }
            }
        }

        var tempformat = request.query['format'];
        
        if (tempformat) {
            if (FORMATOPTS[tempformat.toLowerCase()]) {
                self.format = tempformat.toLowerCase()
            } else {
                self.format = 'json'
            }
        }

        var tempcuts = request.query['cut'];
        
        if (tempcuts) {

            var cutsplit = tempcuts.split("|")

            _.each(cutsplit, function(tempcut, index) {
                var basenamesplit = tempcut.split(":")
                var name = basenamesplit[0]
                var values = basenamesplit[1].split(';')

                var cutter = name.split("@");

                if (cutter.length > 1) {
                    if (self.cut[cutter[0]]) {
                        self.cut[cutter[0]][cutter[1]] = values;
                    } else {
                        self.cut[cutter[0]] = {};
                        self.cut[cutter[0]][cutter[1]] = values;
                    }
                } else {
                    if (self.cut[cutter[0]]) {
                        self.cut[cutter[0]][DEFAULTDRILLDOWN[cutter[0]]] = values;
                    } else {
                        var tempobj= DEFAULTDRILLDOWN[cutter[0]];
                        self.cut[cutter[0]] = { tempobj : values };
                    }
                }
            });               
        }

        var tempdrilldown = request.query["drilldown"];
        
        if (tempdrilldown) {

            var drilldownsplit = tempdrilldown.split("|");

            _.each(drilldownsplit, function(tempdrill) {
                var dd = tempdrill.split("@");
                if (dd.length > 1) {
                    if (self.drilldown[dd[0]]) {
                        self.drilldown[dd[0]].push(dd[1])
                    } else {
                        self.drilldown[dd[0]] = [dd[1]];
                    }
                } else {
                    if (self.drilldown[dd[0]]) {
                        self.drilldown[dd[0]].push(DEFAULTDRILLDOWN[dd[0]]);
                    } else {
                        self.drilldown[dd[0]] = [DEFAULTDRILLDOWN[dd[0]]];
                    }
                }
            });

        }

        self.nulls = request.query['nulls'];

        self.clusterparams = {
            "cluster": request.query["cluster"],
            "numclusters": parseInt(request.query["numclusters"])
        }

        return self.buildQuery();
    };

    /**
     *
     *
     */
    this.buildQuery = function(){
        self.primary_table = _.values(self.cubes_tables)[0];
        self.primary_base = self.primary_table.split("__")[0];
        self.selectable = squel.select()
            .from("finddata." + self.primary_table + " AS " + self.primary_table)
            .field("COUNT(" + self.primary_table + ".geom_time_id)", "count")
            .field("AVG(" + self.primary_table + ".amount)", self.primary_base + "__avg")
            .field("MAX(" + self.primary_table + ".amount)", self.primary_base + "__max")
            .field("MIN(" + self.primary_table + ".amount)", self.primary_base + "__min");

        _.each(self.cubes_tables, function(cubes_ts, index) {
            if (cubes_ts == self.primary_table) {
                return;
            }
            var tempcube_base = cubes_ts.split("__")[0]
            self.selectable = self.selectable
                .right_join("finddata." + cubes_ts + " AS " + cubes_ts, null, cubes_ts + ".geom_time_id = "+ self.primary_table  + ".geom_time_id")
                .field("AVG(" + cubes_ts + ".amount)", tempcube_base + "__avg")
                .field("MAX(" + cubes_ts + ".amount)", tempcube_base + "__max")
                .field("MIN(" + cubes_ts + ".amount)", tempcube_base + "__min");
        });

        _.each(self.drilldown, function(drilldowns, tablename){
            _.each(drilldowns, function(dd,index){
                if (tablename == "geometry__country_level0") {
                    self.selectable = self.selectable
                                            .field(self.primary_table + "." + dd, "geo__" + dd)
                                            .group(self.primary_table + "." + dd);
                } else if (tablename == "geometry__time") {
                    self.selectable = self.selectable
                                            .field(self.primary_table + ".time", "time")
                                            .group(self.primary_table + ".time")
                                            .order("time");

                } else {

                }
            });
        });

        _.each(self.cut, function(cols, table_name) {
            _.each(cols, function(values, colname) {
                if (_.has(['geometry__country_level0', 'geometry__time'], table_name)) {
                    table_name = self.primary_table
                }
                if (values.length > 0) {
                    self.selectable = self.selectable.where(self.primary_table + "." + colname + " IN ('" + values.join("','") + "')");
                }
            });
        });

        if (self.daterange['start']) {
            self.selectable = self.selectable.where(self.primary_table + ".time >= " + self.daterange['start']);
        }

        if (self.daterange['end']) {
            self.selectable = self.selectable.where(self.primary_table + ".time <= " + self.daterange['end']);
        }

        if (!self.nulls) {
            _.each(self.cubes_tables, function(cube_tb){ 
                self.selectable = self.selectable.where(cube_tb + ".amount IS NOT NULL");
            });
        }

        return self.getResponse();

    };

    /**
     *
     *
     */
    this.getResponse = function(){
        
        var callback = null;
        if (self.format == "xls" || self.format == "excel") {
            callback = self.getXls;
        } else if ( self.format == "csv") {
            callback = self.getCsv;
        } else {
            callback = self.getJson;
        }
        return self.query(self.selectable.toString(), callback);

    };

    /**
     *
     *
     */
    this.getJson= function(result){

        var response= {};
        response['cells'] = result['rows'];
        response['attributes'] = _.map(self.drilldown, function(d){
            return d[0];
        });
        self.getDatasetMetadata(function(rowresult){
            response['models'] = _.map(rowresult.rows, function(d){
                if (! d.years){
                    d.years = [];
                }
                else{
                    d.years= _.sortBy(d.years.split(","), function(val){
                        return +val;
                    });
                }
                return d;
            });
            if (self.clusterparams['cluster'] == 'jenks'){
                self.calculateClusters(response);
            }
            else{
                self.rescallback(response);
            }
        });
        //response['models'] = self.get_dataset_metadata();

    };

    /**
     *
     *
     */
    this.getXls = function(result){
        var colkeys = _.keys(result['rows'][0])
        var conf ={};
        conf.stylesXmlFile = "styles.xml";
        conf.cols = _.map(colkeys, function(colkey){
            var colkeysplit = colkey.split("__");
            var type = "number";
            if (colkeysplit[0] == "geo"){
                type = "string";
            }
            return {
                caption:colkey,
                type:type,
                // beforeCellWrite:function(row, cellData){
                //      return cellData;
                // },
                width:28.7109375
            }
        });
        conf.rows = _.map(result['rows'], function(d){
            return _.values(d);
        });

        var result = nodeExcel.execute(conf);
        self.response.setHeader('Content-Type', 'application/vnd.openxmlformats');
        self.response.setHeader("Content-Disposition", "attachment; filename=" + self.cubes[0] + ".xlsx");
        self.response.end(result, 'binary');
        return null;
    };

    /**
     *
     *
     */
    this.getCsv = function(result){
        fields = _.keys(result['rows'][0]);
        values = _.map(result['rows'], function(d){
            return _.values(d);
        });
        values.unshift(fields);
       self.response.setHeader('Content-Type', 'text/csv');
        self.response.setHeader("Content-Disposition", "attachment; filename=" + self.cubes[0] + ".csv");
        self.response.csv(values);
        return null;
    };

    /**
     *
     *
     */
    this.getDatasetMetadata = function(callback){
        var sqlstatement = squel.select()
             .from("public.dataset")
             .field("label")
             .field("description")
             .field('"dataType"')
             .field("created_at")
             .field('name')
             .field('units')
             .field('years')
             .where("name IN  (?)", self.cubes.join("','")).toString();
        self.query(sqlstatement, function(query_result){
            callback(query_result);
        });
    };

    /**
     *
     *
     */
    this.calculateClusters = function(response){

        var clusternum = self.clusterparams.numclusters;

        if (! clusternum) {
            clusternum = 5;
        }

        var dataitem = response['cells'].map(function(d) { return+d[self.primary_table.split("__")[0] + "__avg"]; });

        if (dataitem.length <= clusternum) {
            clusternum = dataitem.length-1;
        }

        var clusters = calculateJenks(dataitem, clusternum);

        var labels= [];

        _.each(clusters, function(val, index, list) {
            if (index >= list.length -1) {
                return false;
            }

            if (index == 0) {
                labels.push("less than " + list[index+1]);                
            } else if (index == list.length -2) {
                labels.push("greater than " + list[index]);
                
            } else {
            labels.push(val + "-" + list[index+1]);
            }
        });

        response['cluster'] = {
            'data': clusters,
            'labels': labels
        };

        self.rescallback(response);
    }

    return this.parseParams(request);

}

module.exports = function(request, response, rescallback) {
    return new DataSource(request, response, rescallback);
};