var debug = require('debug')('arma:api:router');
var todo = require('debug')('arma-todo:api:router');

var express = require('express');
var router = express.Router();
var url = require('url');
var config = require('../modules/config').all();


var async = require('../modules/async');
var Q = require('q');

var xml2js = require('xml2js');
var _ = require('lodash');

var OFFLINE_MODE = false;

var resolvePromises = function(object){
    var promises = [];

    // For variable capture...
    var processPromise = function(obj, key){
        promises.push(obj[key].then(function(value){
            debug(key, value);
            obj[key] = value;
        }));
    };

    // Iterate over object and find nested promises
    var iterObject = function(obj){
        for(var key in obj){
            if (obj.hasOwnProperty(key)){
                var v = obj[key];
                if (Q.isPromise(v)) {
                    processPromise(obj, key);
                } else if ((typeof v) === "object"){
                    iterObject(v);
                }
            }
        }
    };
    iterObject(object);
    return Q.all(promises).thenResolve(object);
};

/**
 * Returns a function which will either return the result or a 404 error
 *
 * @param res
 * @returns {Function}
 */
var processFindOne = function(res){
    return function(err, result){
        if (err || !result){
            res.status(404).end();
        } else {
            if (Array.isArray(result)){
                result.forEach(function(r){
                    delete r._id;
                });
            } else {
                delete result._id;
            }
            res.json(result);
        }
    };
};

/**
 * Returns a function to process updates (empty result or 500 error)
 *
 * @param res
 * @returns {Function}
 */
var processUpdate = function(res){
    return function(err, items){
        debug('processUpdate', err, items);
        if (err){
            debug('err', err);
            res.status(500).end();
        } else {
            res.status(200).end();
        }
    }
};

var processFetchJson = function(res){
    return function(err, obj){
        debug('processFetchJson', err, obj);
        if (err){
            res.status(500).end();
        } else {
            res.json(obj);
        }
    }
};

var fetchJson = function(options, res){
    async.promiseJson(options).nodeify(processFetchJson(res));
};

var forward = function(options, res){
    async.promiseForward(options).nodeify(function(err, data){
        if (err){
            debug('err', err);
            res.status(500).end();
        } else {
            res.send(data);
            res.end();
        }
    });
};



_.forIn(require('../modules'), function(module, moduleName) {
  if (module.apiRouter){
    debug('add api routes for ' + moduleName);
    router.use(module.apiRouter);
  }
});



module.exports = router;
