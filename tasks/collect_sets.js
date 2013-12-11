/* global toString: false */
'use strict';

var UTIL = require('util'),

    QIO_FS = require("q-io/fs"),
    JSPATH = require('jspath'),

    //bem tools modules
    BEM = require('bem'),
    Q = BEM.require('q'),
    LOGGER = BEM.require('./logger'),
    U = BEM.require('./util'),
    PATH = BEM.require('./path'),
    _ = BEM.require('underscore'),

    //application modules
    config = require('../config/config');

/**
 *
 * @param target
 */
var execute = function(target) {
    LOGGER.debug(UTIL.format('collect sets start for target %s', target.name));
};

module.exports = execute;

