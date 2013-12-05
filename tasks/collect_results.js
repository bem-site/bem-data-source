/* global toString: false */
'use strict';

var UTIL = require('util'),

    //bem tools modules
    BEM = require('bem'),
    Q = BEM.require('q'),
    LOGGER = BEM.require('./logger'),
    U = BEM.require('./util'),
    PATH = BEM.require('./path'),
    _ = BEM.require('underscore');

var database = {
    tags: [],
    types: [],
    authors: [],
    categories: [],
    posts: [],
    libs: [],
    versions: [],
    levels: [],
    blocks: []
};

var execute = function(targets) {
    var def = Q.defer();
    def.resolve(targets);
    return def.promise;
};

module.exports = execute;
