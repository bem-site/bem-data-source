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
    config = require('../../config/config'),
    git = require('../../libs/git'),
    util = require('../../libs/util'),
    normalize = require('./normalize_db');

var execute = function(targets) {
    LOGGER.info('step8: - collectResults start');

    var def = Q.defer(),
        contentDir = config.get('contentDirectory'),
        outputTargetFile = config.get('outputTargetFile');

    try {
        QIO_FS.listTree(PATH.resolve(contentDir), function(path) {
            return path.indexOf(outputTargetFile, path.length - outputTargetFile.length) !== -1;
        })
        .then(readFiles)
        .then(writeFiles)
        .then(updateRemoteData)
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
 * Write data into two json files (human readable and minified)
 * @param data - {Object} data
 * @returns {defer.promise|*}
 */
var writeFiles = function(data) {
    var def = Q.defer(),
        outputDir = config.get('outputDirectory'),
        dataFile = config.get('outputDataFile'),
        dataMinFile = config.get('outputDataMinFile'),
        normalize = config.get('normalize'),
        version = (new Date()).getTime().toString();

    data = _.union.apply(null, planerizeResults(data));

    if(normalize && normalize === 'true') {
        data = normalize(data);
    }

    util.createDirectory(PATH.join(outputDir, version))
    .then([
        U.writeFile(PATH.join(outputDir, version, dataFile), JSON.stringify(data, null, 4)),
        U.writeFile(PATH.join(outputDir, version, dataMinFile), JSON.stringify(data))
    ])
    .then(function() {
        def.resolve(data);
    });

    return def.promise;
};

var updateRemoteData = function(data) {
    return createOrUpdate(JSON.stringify(data, null, 4), config.get('outputDataFile'))
        .then(function() {
            createOrUpdate(JSON.stringify(data), config.get('outputDataMinFile'));
        });
};

var createOrUpdate = function(data, path) {
    var dataRepository = config.get("dataRepository"),
        o = {
            user: dataRepository.user,
            repo: dataRepository.name,
            branch: 'master',
            message: UTIL.format('Build: %s', (new Date()).toString()),
            content: (new Buffer(data)).toString('base64'),
            path: path
        };

    return git.getContent({
        user: dataRepository.user,
        repo: dataRepository.name,
        ref: 'master'
    }, path).then(
        function(file) {
            if(file.type === 'file') {
                return git.updateFile(_.extend({ sha: file.sha }, o));
            }else {
                return git.createFile(o);
            }
        },
        function(error) {
            //TODO change this code
            console.log(error);
        }
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
