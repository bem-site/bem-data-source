/* global toString: false */
'use strict';

var UTIL = require('util'),

    QIO_FS = require("q-io/fs"),

    //bem tools modules
    BEM = require('bem'),
    Q = BEM.require('q'),
    LOGGER = BEM.require('./logger'),
    U = BEM.require('./util'),
    PATH = BEM.require('./path'),
    _ = BEM.require('underscore'),

    //application modules
    config = require('../config/config');

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
    var def = Q.defer(),
        contentDir = config.get('contentDirectory'),
        outputTargetFile = config.get('outputTargetFile');

    try {
        QIO_FS.listTree(PATH.resolve(contentDir), function(path) {
            return path.indexOf(outputTargetFile, path.length - outputTargetFile.length) !== -1;
        })
        .then(
            function(files) {
                return readFiles(files);
            }
        )
        .then(
            function(data) {
                data = planerizeResults(data);
                data = _.union.apply(null, data);
                def.resolve(targets);
            }
        );
    }catch(err) {
        def.reject(err);
    }
    return def.promise;
};

/**
 * Return promises with result of reading and parsing compiled data.json files
 * @param files - {Array} array of string path to files which should be read
 * @returns {Q.allSettled|*}
 */
var readFiles = function(files) {
    return Q.allSettled(
        files.map(
            function(file) {
                return U.readFile(file)
                    .then(
                        function(src) {
                            return JSON.parse(src);
                        }
                    );
            }
        )
    );
};

/**
 * Returns plane content from tree of promises
 * @param data {Object} tree of promises
 * @returns {Array}
 */
var planerizeResults = function(data) {
    var plane = [];
    data
        .filter(function(item) {
            return item.state === 'fulfilled';
        })
        .map(function(item) {
            return plane.push(item.value);
        });
    return plane;
};

module.exports = execute;
