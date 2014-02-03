/* global toString: false */
'use strict';

var util = require('util'),
    path = require('path'),

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
