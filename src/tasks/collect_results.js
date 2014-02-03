/* global toString: false */
'use strict';

var util = require('util'),
    path = require('path'),

    q = require('q'),
    q_io = require('q-io/fs'),
    _ = require('lodash'),

    config = require('../config'),
    logger = require('../libs/logger')(module),
    api = require('../libs/api'),
    util = require('../libs/util');

module.exports = {

    run: function(targets) {
        logger.info('step8: - collectResults start');

        var def = q.defer(),
            contentDir = config.get('contentDirectory'),
            outputTargetFile = config.get('outputTargetFile');

        try {
            q_io.listTree(path.resolve(contentDir), function(path) {
                return path.indexOf(outputTargetFile, path.length - outputTargetFile.length) !== -1;
            })
                .then(readFiles)
                .then(postProcessData)
                .then(function(data) {
                    return q.all([updateLocalData(data), updateRemoteData(data)]);
                })
                .then(function() {
                    logger.info('step8: - collectResults end');
                    def.resolve(targets);
                });
        }catch(err) {
            logger.error(err.message);
            def.reject(err);
        }
        return def.promise;
    }
};

/**
 * Return promises with result of reading and parsing compiled data.json files
 * @param files - {Array} array of string path to files which should be read
 * @returns {Q.allSettled|*}
 */
var readFiles = function(files) {
    return q.allSettled(
        files.map(function(file) {
            logger.silly('collect results: read file %s', file);
            return q_io.read(file)
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
    var def = q.defer(),
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

    util.createDirectory(path.join(outputDir, version))
    .then([
        q_io.write(path.join(outputDir, version, dataFile), JSON.stringify(data, null, 4)),
        q_io.writeFile(path.join(outputDir, version, dataMinFile), JSON.stringify(data))
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
                message: util.format('Build: %s', (new Date()).toString()),
                content: (new Buffer(data)).toString('base64'),
                path: path
            });

        return api
            .getContent(dataConfig, path)
            .then(
                function(file) {
                    return file.type === 'file' ? api.updateFile(_.extend({ sha: file.sha }, o)) : api.createFile(o);
                },
                function(error) {
                    if(error.code === 404) {
                        api.createFile(o);
                    }
                }
            );
    };

    return createOrUpdate(JSON.stringify(data, null, 4), config.get('outputDataFile'))
        .then(function() {
            createOrUpdate(JSON.stringify(data), config.get('outputDataMinFile'));
        });

};

