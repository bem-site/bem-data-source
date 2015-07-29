'use strict';

var util = require('util'),
    md = require('marked'),
    bmdr = require('bem-md-renderer'),
    _ = require('lodash');

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
 * Checks if given string is html string
 * @param {String} str (can be markdown or html string)
 * @returns {boolean}
 */
exports.isHtml = function (content) {
    var str = content.trim(),
        length = str.length;

    return str.charAt(0) === '<' && str.charAt(length - 1) === '>' && length >= 3;
};

/**
 * Converts markdown content into html with marked module
 * @param {String} content of markdown file
 * @returns {String} - html string
 */
exports.mdToHtml = function (content) {
    if (this.isHtml(content)) {
        return content;
    }

    return md(content, {
        gfm: true,
        pedantic: false,
        sanitize: true,
        renderer: bmdr.getRenderer()
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
