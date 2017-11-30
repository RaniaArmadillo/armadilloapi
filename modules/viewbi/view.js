'use strict';

var debug = require('debug')('arma:campusaar:view');

var mongoose = require('mongoose');

var ViewSchema = new mongoose.Schema({
  datasource: String,
  view: String,
  description: String,
  vquery:[{type: mongoose.Schema.Types.ObjectId, ref: 'Vquery'}],
  date: Date,
  creator: String 
});

var View = mongoose.model('View', ViewSchema);
module.exports = View;