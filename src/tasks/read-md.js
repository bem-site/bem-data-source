'use strict';

var path = require('path'),
    util = require('util'),

    _ = require('lodash'),
    inherit = require('inherit'),
    vow = require('vow'),
    vowFs = require('vow-fs'),

    config = require('../config'),
    utility = require('../util'),
    Base = require('./base');

module.exports = inherit(Base, {

    /**
     * Read markdown files for library and compile them into html
     * @param {Object} result model
     * @returns {*}
     */
    run: function (result) {
        this._logger.info('read markdown files for library %s', this._target.name);
        var promises = _
            .chain(this._target.mdTargets)
            .keys()
            .map(function (key) {
                return this._loadMarkdown(result, key);
            }, this)
            .value();
        return vow.allResolved(promises).then(function () { return result; });
    },

    _getPattern: function (key) {
        var languages = config.get('languages') || ['en'],
            pattern = this._target.mdTargets[key].pattern;
        if (!_.isObject(pattern)) {
            pattern = languages.reduce(function (prev, lang) {
                prev[lang] = pattern;
                return prev;
            }, {});
        }
        return pattern;
    },

    /**
     * Reads markdown files from filesystem
     * @param {Object} result model
     * @param {String} key with name of markdown doc
     * @returns {*}
     * @private
     */
    _loadMarkdown: function (result, key) {
        return vowFs
            .listDir(path.join(this._target.getContentPath(), this._target.mdTargets[key].folder))
            .then(function (files) {
                var pattern = this._getPattern(key);
                result.docs[key] = {
                    title: this._target.titles[key],
                    content: null
                };

                return vow.allResolved(Object.keys(pattern).map(function (lang) {
                    var docPath = files
                        .filter(function (item) {
                            return item.indexOf(pattern[lang]) !== -1;
                        })
                        .sort(function (a, b) {
                            var toVersion = function (str) {
                                return str.replace(pattern[lang], '').replace('-', '').replace('.', '');
                            };
                            return toVersion(a) - toVersion(b);
                        })
                        .map(function (item) {
                            result.docs[key].url = result.docs[key].url || {};
                            result.docs[key].url[lang] = util.format('%s/blob/%s/%s',
                                result.url, result.ref, path.join(this._target.mdTargets[key].folder, item));
                            return path.join(this._target.getContentPath(), this._target.mdTargets[key].folder, item);
                        }, this)
                        .pop();

                    this._logger.debug('Read markdown file %s', docPath);
                    return vowFs
                        .read(docPath, 'utf-8')
                        .then(function (content) {
                            try {
                                result.docs[key].content = result.docs[key].content || {};
                                result.docs[key].content[lang] = utility.mdToHtml(content);
                            }catch (e) {
                                this._logger.error('Error occur while parsing file %s', docPath);
                            }
                        }, this);
                }, this));
            }, this);
    }
});
