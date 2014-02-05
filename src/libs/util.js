/* global toString: false */
'use strict';

var util = require('util'),
    path = require('path'),
    fs = require('fs'),

    semver = require('semver'),
    q = require('q'),
    q_io = require('q-io/fs'),

    logger = require('./logger')(module),
    config = require('../config');

/**
 * Creates directory with given name
 * @param dirName - {String} name of directory
 * @returns {Promise|*|Promise.fail}
 */
exports.createDirectory = function(dirName) {
    return q_io
        .makeDirectory(dirName)
        .then(function() {
            logger.debug('%s directory has been created', dirName);
        })
        .fail(function(err) {
            if(err.code === 'EEXIST') {
                logger.warn('%s directory already exist', dirName);
            }
        });
};

/**
 * Sort tags function
 * @param a - {String} first tag value
 * @param b - {String} second tag value
 * @returns {number}
 */
exports.sortTags = function(a, b) {
    a = semver.clean(a);
    b = semver.clean(b);
    if(semver.valid(a) !== null && semver.valid(b) !== null) {
        return semver.gt(a, b) ? 1 : (semver.lt(a, b) ? -1 : 0);
    }else {
        return a - b;
    }
};

/**
 * Filter promises collection by fulfilled criteria and post processing them
 * @param promises - {Array} array of promises
 * @param mapCallback - {Function} callback function for map
 * @returns {Array|*}
 */
exports.filterAndMapFulfilledPromises = function(promises, mapCallback) {
    return promises
        .filter(
            function(item) {
                return item.state === 'fulfilled';
            }
        )
        .map(mapCallback);
};

/**
 * Filter promises collection by fulfilled criteria and post processing them
 * @param promises - {Array} array of promises
 * @returns {Array|*}
 */
exports.filterFulfilledPromises = function(promises) {
    return promises.filter(
        function(item) {
            return item.state === 'fulfilled';
        }
    );
};

/**
 * Executes specified command with options.
 * @param {String} cmd  Command to execute.
 * @param {Object} options  Options to `child_process.exec()` function.
 * @param {Boolean} resolveWithOutput  Resolve returned promise with command output if true.
 * @return {Promise * String | Undefined}
 */
exports.exec = function(cmd, options, resolveWithOutput) {

    var cp = require('child_process').exec(cmd, options),
        d = q.defer(),
        output = '';

    cp.on('exit', function(code) {
        if (code === 0) {
            return d.resolve(resolveWithOutput && output ? output : null);
        }
        d.reject(new Error(util.format('%s failed: %s', cmd, output)));
    });

    cp.stderr.on('data', function(data) {
        logger.verbose(data);
        output += data;
    });

    cp.stdout.on('data', function(data) {
        logger.verbose(data);
        output += data;
    });

    return d.promise;
};

/**
 * Check if current path is directory
 * @param path {String} path
 * @returns {Boolean}
 */
exports.isDirectory = function(path) {
    try {
        return fs.statSync(path).isDirectory();
    } catch(ignore) {}
    return false;
};

/**
 * Returns list of directory names for _path
 * @param _path {String} path
 * @returns {Array} array of directory names, sorted alphabetically
 */
exports.getDirs = function(_path) {
    try {
        return exports.isDirectory(_path)?
            fs.readdirSync(_path)
                .filter(function(d) {
                    return !(/^\.svn$/.test(d)) && exports.isDirectory(path.join(_path, d));
                })
                .sort() :
            [];
    } catch (e) {
        return [];
    }
};
