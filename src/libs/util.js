/* global toString: false */
'use strict';

var util = require('util'),
    path = require('path'),
    fs = require('fs'),
    cp = require('child_process'),

    semver = require('semver'),
    vow = require('vow'),
    md = require('marked'),

    logger = require('./logger')(module),
    config = require('../config');

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
 * Executes specified command with options.
 * @param {String} cmd  Command to execute.
 * @param {Object} options  Options to `child_process.exec()` function.
 * @return {Promise * String | Undefined}
 */
exports.exec = function(cmd, options) {
    var proc = cp.exec(cmd, options),
        d = vow.defer(),
        output = '';

    proc.on('exit', function(code) {
        if (code === 0) {
            return d.resolve();
        }
        d.reject(new Error(util.format('%s failed: %s', cmd, output)));
    });

    proc.stderr.on('data', function(data) {
        logger.verbose(data);
        output += data;
    });

    proc.stdout.on('data', function(data) {
        logger.verbose(data);
        output += data;
    });

    return d.promise();
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

/**
 * Converts markdown content into html with marked module
 * @param content - {String} markdown content
 * @returns {String} - html string
 */
exports.mdToHtml = function(content) {
    return md(content, {
        gfm: true,
        pedantic: false,
        sanitize: false
    });
};
