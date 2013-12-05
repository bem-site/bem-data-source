/* global toString: false */
'use strict';

var FS = require('fs'),
    CP = require('child_process'),
    UTIL = require('util'),

    BEM = require('bem'),
    Q = BEM.require('q'),
    QIO_FS = BEM.require('q-fs'),
    PATH = BEM.require('./path'),
    LOGGER = BEM.require('./logger'),
    U = BEM.require('./util'),

    config = require('../config/config');

var EXTENSIONS = ['wiki', 'md', 'meta.json', 'png'],
    LANGUAGES = ['en', 'ru', 'ja', 'ko'];

exports.createContentDirectory = function() {
    return QIO_FS
        .makeDirectory(config.get('contentDirectory'))
        .then(function() {
            LOGGER.debug('Content directory has been created');
        })
        .fail(function(err) {
            if(err.code === 'EEXIST') {
                LOGGER.warn('Content directory already exist');
            }
        });
};

exports.sortTags = function(a, b) {
    var re = /^v?(\d+)\.(\d+)\.(\d+)$/;
    a = a.replace(re, "$1$2$3");
    b = b.replace(re, "$1$2$3");
    return a - b;
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
