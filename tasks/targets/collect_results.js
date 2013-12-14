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
    config = require('../../config/config'),
    util = require('../../libs/util'),
    normalize = require('./../normalize_db');

var execute = function(targets) {
    LOGGER.info('step8: - collectResults start');

    var def = Q.defer(),
        contentDir = config.get('contentDirectory'),
        outputDir = config.get('outputDirectory'),
        outputTargetFile = config.get('outputTargetFile'),
        normalize = config.get('normalize');

    try {
        QIO_FS.listTree(PATH.resolve(contentDir), function(path) {
            return path.indexOf(outputTargetFile, path.length - outputTargetFile.length) !== -1;
        })
        .then(function(files) {
            return readFiles(files);
        })
        .then(function(data) {
            var versionFolder = (new Date()).getTime().toString();
            data = _.union.apply(null, planerizeResults(data));

            if(normalize) {
                data = normalize(data);
            }

            return util.createDirectory(PATH.join(outputDir, versionFolder))
                .then(function() {
                    return Q.all(
                        [
                            U.writeFile(PATH.join(outputDir, versionFolder, 'data.json'), JSON.stringify(data, null, 4)),
                            U.writeFile(PATH.join(outputDir, versionFolder, 'data_min.json'), JSON.stringify(data))
                        ]
                    );
                })
                .then(function() {
                    //TODO commit data to github
                });
        })
        .then(function() {
            LOGGER.info('step8: - collectResults end');
            def.resolve(targets);
        });
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
        files.map(function(file) {
            LOGGER.silly(UTIL.format('collect results: read file %s', file));
            return U.readFile(file)
                .then(function(src) {
                    return JSON.parse(src);
                });
        })
    );
};

/**
 * Returns plane content from tree of promises
 * @param data {Object} tree of promises
 * @returns {Array}
 */
var planerizeResults = function(data) {
    return util.filterFulfilledPromises(data)
        .reduce(function(prev, item) {
            return prev.concat(item.value);
        }, []);
};

module.exports = execute;
