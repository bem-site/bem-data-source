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
    normalize_db = require('./normalize_db');

module.exports = function(targets) {
    LOGGER.info('step8: - collectResults start');

    var def = Q.defer(),
        contentDir = config.get('contentDirectory'),
        outputTargetFile = config.get('outputTargetFile');

    try {
        QIO_FS.listTree(PATH.resolve(contentDir), function(path) {
            return path.indexOf(outputTargetFile, path.length - outputTargetFile.length) !== -1;
        })
        .then(readFiles)
        .then(postProcessData)
        .then(function(data) {
            return Q.all([updateLocalData(data), updateRemoteData(data)]);
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
 * Post process all data for final output
 * @param data - {Array} array of fulfilled promises with content of files
 * @returns {}
 */
var postProcessData = function(data) {
    var def = Q.defer(),
        normalize = config.get('normalize');

    try {
        data = _.union.apply(null, function(_data) {
            return util.filterFulfilledPromises(_data)
                .reduce(function(prev, item) {
                    return prev.concat(item.value);
                }, []);
        }(data));

        data =(function(d) {
            var _data = {'en': [], 'ru': []};
            d.forEach(function(item) {
                _data[item.language] && _data[item.language].push(item);
            });
            return _data;
        })(data);

        if(normalize && normalize === 'true') {
            data = normalize_db(data);
        }

        def.resolve(data);
    }catch(err) {
        def.reject(err.message);
    }

    return def.promise;
};

/**
 * Write data into two json files (human readable and minified)
 * @param data - {Object} data
 * @returns {defer.promise|*}
 */
var updateLocalData = function(data) {
    var def = Q.defer(),
        outputDir = config.get('outputDirectory'),
        dataFile = config.get('outputDataFile'),
        dataMinFile = config.get('outputDataMinFile'),
        version = (new Date()).getTime().toString();

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

/**
 * Update remote data on dataRepository with github API
 * @param data - {Object} data
 * @returns {*}
 */
var updateRemoteData = function(data) {
    var createOrUpdate = function(data, path) {
        var dataConfig = config.get("dataConfig"),
            o = _.extend(dataConfig, {
                branch: dataConfig.ref,
                message: UTIL.format('Build: %s', (new Date()).toString()),
                content: (new Buffer(data)).toString('base64'),
                path: path
            });

        return git
            .getContent(dataConfig, path)
            .then(
                function(file) {
                    return file.type === 'file' ? git.updateFile(_.extend({ sha: file.sha }, o)) : git.createFile(o);
                },
                function(error) {
                    if(error.code === 404) {
                        git.createFile(o);
                    }
                }
            );
    };

    return createOrUpdate(JSON.stringify(data, null, 4), config.get('outputDataFile'))
        .then(function() {
            createOrUpdate(JSON.stringify(data), config.get('outputDataMinFile'));
        });

};

