/* global toString: false */
'use strict';

var FS = require('fs'),
    UTIL = require('util'),
    SEMVER = require('semver'),

    BEM = require('bem'),
    Q = BEM.require('q'),
    QIO_FS = BEM.require('q-fs'),
    PATH = BEM.require('./path'),
    LOGGER = BEM.require('./logger'),
    U = BEM.require('./util'),

    config = require('../config/config');

var EXTENSIONS = ['wiki', 'md', 'meta.json', 'png'],
    LANGUAGES = ['en', 'ru', 'ja', 'ko'];

/**
 * Creates directory with given name
 * @param dirName - {String} name of directory
 * @returns {Promise|*|Promise.fail}
 */
exports.createDirectory = function(dirName) {
    return QIO_FS
        .makeDirectory(dirName)
        .then(function() {
            LOGGER.debug(UTIL.format('%s directory has been created', dirName));
        })
        .fail(function(err) {
            if(err.code === 'EEXIST') {
                LOGGER.warn(UTIL.format('%s directory already exist', dirName));
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
    a = SEMVER.clean(a);
    b = SEMVER.clean(b);
    if(SEMVER.valid(a) !== null && SEMVER.valid(b) !== null) {
        return SEMVER.gt(a, b) ? 1 : (SEMVER.lt(a, b) ? -1 : 0);
    }else {
        return a - b;
    }
};

exports.filterDocDirectory = function(dir) {
    return ['.git', '.bem'].indexOf(dir) === -1;
};

exports.filterDocFile = function(file, dir) {
    var isValidExtension = EXTENSIONS.some(function(extension) {
        return file.indexOf(extension, file.length - extension.length) !== -1;
    });

    if(!isValidExtension){
        return false;
    }

    return file.split('.')[0] === dir;
};

/**
 * Returns file extension
 * @param file - {String} file name
 * @returns {String} extension of file
 */
exports.getFileExtension = function(file) {
    var result = null;
    EXTENSIONS.some(function(extension) {
        result = extension;
        return file.indexOf(extension, file.length - extension.length) !== -1;
    });
    return result;
};

/**
 * Returns file language
 * @param file - {String} file name
 * @returns {String} language
 */
exports.getFileLanguage = function(file) {
    var result = null;
    LANGUAGES.some(function(language) {
        result = language;
        return file.indexOf('.' + language + '.') !== -1;
    });
    return result;
};

/**
 * Return compiled date in milliseconds from date in dd-mm-yyyy format
 * @param  {String} dateStr - staring date in dd-mm-yyy format
 * @return {Number} date in milliseconds
 */
exports.formatDate = function(dateStr) {
    var re = /[^\w]+|_+/,
        date = new Date(),
        dateParse = dateStr.split(re),
        dateMaskFrom = 'dd-mm-yyyy'.split(re);

    dateMaskFrom.forEach(function(elem, indx) {
        switch (elem) {
            case 'dd':
                date.setDate(dateParse[indx]);
                break;
            case 'mm':
                date.setMonth(dateParse[indx] - 1);
                break;
            default:
                if (dateParse[indx].length === 2) {
                    if(date.getFullYear() % 100 >= dateParse[indx]) {
                        date.setFullYear('20' + dateParse[indx]);
                    }else {
                        date.setFullYear('19' + dateParse[indx]);
                    }
                }else {
                    date.setFullYear(dateParse[indx]);
                }
        }
    });

    return date.valueOf();
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
