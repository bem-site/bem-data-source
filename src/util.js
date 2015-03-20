'use strict';

var util = require('util'),
    md = require('marked'),
    _ = require('lodash'),

    renderer = require('./renderer');

exports.getStorageConfiguration = function (config, env) {
    var common;

    if (!config) {
        throw new Error('storage configuration were not set');
    }

    common = config['common'];

    if (!common) {
        throw new Error('common storage configuration were not found');
    }

    if (!config['testing']) {
        throw new Error('testing storage configuration were not found');
    }

    if (!config['production']) {
        throw new Error('production storage configuration were not found');
    }

    return _.extend({}, common, config[env]);
};

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
 * Parses given gh url
 * @param {String} url for parse
 * @returns {Object} object with parts of parsed url
 * @private
 */
exports.parseGhUrl = function (url) {
    var regexp = /^https?:\/\/(.+?)\/(.+?)\/(.+?)\/(tree|blob)\/(.+?)\/(.+)/,
        _url = url.match(regexp);

    if (!_url) {
        throw new Error(util.format('Invalid format of url %s', url));
    }

    return {
        type: _url[1].indexOf('yandex') > -1 ? 'private' : 'public',
        user: _url[2],
        repo: _url[3],
        ref:  _url[5],
        path: _url[6]
    };
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
