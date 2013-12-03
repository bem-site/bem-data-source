/* global toString: false */
'use strict';

var UTIL = require('util'),

    //bem tools modules
    BEM = require('bem'),
    Q = BEM.require('q'),
    LOGGER = BEM.require('./logger'),
    _ = BEM.require('underscore'),

    //application modules
    config = require('../config/config');

var execute = function(target) {
    LOGGER.silly(UTIL.format('finalize start for target %s', target.name));


};

module.exports = execute;
