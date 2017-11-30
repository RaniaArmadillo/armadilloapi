'use strict';

var debug = require('debug')('arma:campusaar:query');

var mongoose = require('mongoose');


var querySchema = new mongoose.Schema({
    name: String,
    description: String,
    config: String,
    result: String,
    esquery: String
});

var  Query = mongoose.model('query',querySchema ) ;

module.exports = Query;