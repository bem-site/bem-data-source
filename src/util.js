'use strict';

var fs = require('fs-extra'),
    util = require('util'),

    md = require('marked'),
    vow = require('vow'),
    Rsync = require('rsync'),

    renderer = require('./renderer'),
    logger = require('./logger');

/**
 * Converts markdown content into html with marked module
 * @param {String} content of markdown file
 * @returns {String} - html string
 */
exports.mdToHtml = function (content) {
    return md(content, {
        gfm: true,
        pedantic: false,
        sanitize: false,
        renderer: renderer.get()
    });
};

/**
 * Removes directory with all files and subdirectories
 * @param {String} path to directory on filesystem
 * @returns {*}
 */
exports.removeDir = function (path) {
    var def = vow.defer();
    fs.remove(path, function (err) {
        if (err) {
            def.reject(err);
        }
        def.resolve();
    });

    return def.promise();
};

/**
 * Copy file from target path to destination path
 * @param {String} target path
 * @param {String} destination path
 * @returns {*}
 */
exports.copy = function (target, destination) {
    var def = vow.defer();
    fs.copy(target, destination, function (err) {
        if (err) {
            def.reject(err);
        }
        def.resolve();
    });

    return def.promise();
};

/**
 * Runs rsync command with options
 * @param {Object} options - options for rsync command
 * @returns {*}
 */
exports.rsync = function (options) {
    var def = vow.defer(),
        rsync = Rsync.build(options);

    rsync.set('safe-links');
    rsync.set('copy-links');
    logger.debug(util.format('rsync command: %s', rsync.command()), module);
    rsync.execute(function (err, code) {
            if (err) {
                logger.error(util.format('Rsync failed wit error %s', err.message), module);
                def.reject(err);
            }else {
                def.resolve(code);
            }
        },
        function (data) {
            logger.debug(data.toString(), module);
        },
        function (data) {
            logger.warn(data.toString(), module);
        }
    );
    return def.promise();
};

/**
 * Separates array into small array with given chunkSize length
 * @param {Array} arr - array for separate
 * @param {Number} chunkSize - size of chunk
 * @returns {Array}
 */
exports.separateArrayOnChunks = function (arr, chunkSize) {
    var _arr = arr.slice(0),
        arrays = [];

    while (_arr.length > 0) {
        arrays.push(_arr.splice(0, chunkSize));
    }

    return arrays;
};
