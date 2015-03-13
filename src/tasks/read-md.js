'use strict';

var path = require('path'),

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
        this._logger.debug('read markdown files for library %s', this._target.name);
        return vow.allResolved(Object.keys(this._target.mdTargets)
                .map(function (key) {
                    return this._loadMarkdown(result.docs, key);
                }, this)
        );
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
            .listDir(path.join(this._target.contentPath, this._target.mdTargets[key].folder))
            .then(function (files) {
                var languages = config.get('languages') || ['en'],
                    pattern = this._target.mdTargets[key].pattern;

                if (!_.isObject(pattern)) {
                    pattern = languages.reduce(function (prev, lang) {
                        prev[lang] = pattern;
                        return prev;
                    }, {});
                }

                result[key] = {
                    title: this._target.titles[key],
                    content: null
                };

                return vow.allResolved(Object.keys(pattern).map(function (lang) {
                    var file  = files
                        .filter(function (file) {
                            return file.indexOf(pattern[lang]) !== -1;
                        })
                        .sort(function (a, b) {
                            var toVersion = function (str) {
                                return str.replace(pattern[lang], '').replace('-', '').replace('.', '');
                            };
                            return toVersion(a) - toVersion(b);
                        })
                        .pop();

                    return vowFs
                        .read(path.join(path.join(this._target.contentPath,
                            this._target.mdTargets[key].folder), file), 'utf-8')
                        .then(function (content) {
                            try {
                                result[key].content = result[key].content || {};
                                result[key].content[lang] = utility.mdToHtml(content);
                            }catch (e) {}
                        });
                }, this));
            }, this);
    }
});
