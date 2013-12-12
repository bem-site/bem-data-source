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
    config = require('../../config/config');

/**
 *
 * @param target
 */
var execute = function(target) {
    LOGGER.debug(UTIL.format('collect sets start for target %s', target.name));

    var def = Q.defer(),
        blockResultFile = 'data.json',
        outputTargetFile = config.get('outputTargetFile');

    try {
        QIO_FS.listTree(PATH.resolve(target.path),
            function(path) {
                return path.indexOf(blockResultFile, path.length - blockResultFile.length) !== -1;
            }
        )
        .then(
            function(files) {
                return readFiles(files);
            }
        )
        .then(
            function(data) {
                data = _.union.apply(null, planerizeResults(data));
                return U.writeFile(PATH.join(target.path, outputTargetFile), JSON.stringify(data, null, 4));
            }
        )
            .then(
            function() {
                LOGGER.info('step8: - collectResults end');
                def.resolve(target);
            }
        );
    }catch(err) {
        LOGGER.error(err.message);
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
                LOGGER.silly(UTIL.format('collect results: read file %s', file));
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

