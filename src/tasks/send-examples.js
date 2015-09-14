'use strict';

var path = require('path'),
    util = require('util'),

    _ = require('lodash'),
    vow = require('vow'),
    vowFs = require('vow-fs'),
    vowNode = require('vow-node'),
    inherit = require('inherit'),
    glob = require('glob'),

    storage = require('../storage'),
    config = require('../config'),
    constants = require('../constants'),
    Base = require('./base');

module.exports = inherit(Base, {

    RETRY_AMOUNT: 5,

    /**
     * Creates glob pattern for example
     * +(desktop.examples|touch-pad.examples|touch-phone.examples)/**
     * @returns {Array}
     */
    createGlobPattern: function () {
        var conf = this._target.rsyncConfiguration,
            levels = constants.LEVELS,
            folders = [];

        conf.targets.forEach(function (suffix) {
            if (suffix.indexOf('*') > -1) {
                levels.forEach(function (level) {
                    folders.push(level + suffix.replace('*', ''));
                });
            } else {
                folders.push(suffix);
            }
        });

        folders = '+(' + folders.join('|') + ')/**';
        return folders;
    },

    run: function () {
        var o = this._target.getOptions(),
            ofl = o['maxOpenFiles'] || config.get('maxOpenFiles') || constants.MAXIMUM_OPEN_FILES,
            exampleKeys = [];

        if (o.isDryRun) {
            this._logger.info('"Publish" or "Send" command was launched in dry run mode');
            this._logger.warn(
                'Data for %s %s won\' be sent to storage', this._target.sourceName, this._target.ref);
        }

        if (o.isDocsOnly) {
            this._logger.warn('"Publish" commands was launched with enabled flag docs-only. ' +
            'Examples will not be sent to mds storage');
            return vow.resolve();
        }

        return vowNode.promisify(glob)(this.createGlobPattern(), { cwd: process.cwd(), nodir: true })
            .then(function (files) {
                if (o.examples) {
                    files = files.filter(function (file) {
                        return file.indexOf(o.examples) > -1;
                    }, this);
                }

                var excludeRules = this._target.rsyncConfiguration.exclude;

                if (excludeRules && excludeRules.length) {
                    files = files.filter(function (file) {
                        return excludeRules.every(function (rule) {
                            return path.basename(file).indexOf(rule.replace('*', '')) === -1;
                        });
                    });
                }

                this._logger.debug('example files count: %s', files.length);

                var _this = this;

                return _.chunk(files, ofl).reduce(function (prev, item, index) {
                    prev = prev.then(function () {
                        this._logger.verbose('send files in range %s - %s', index * ofl, (index + 1) * ofl);
                        var promises = item.map(function (_item) {
                            return o.isDryRun ? vow.resolve() : this._sendFile(_item, 0);
                        }, this);

                        return vow.all(promises).then(function (keys) {
                            exampleKeys = exampleKeys.concat(keys);
                            return exampleKeys;
                        });
                    }, _this);
                    return prev;
                }, vow.resolve());
            }, this)
            .then(function () {
                this._logger.debug('write example registry key');
                var examplesRegistryKey =
                    util.format('%s/%s/%s', this._target.sourceName, this._target.ref, 'examples');
                return o.isDryRun ? vow.resolve() :
                    storage.get(o.storage).writeP(examplesRegistryKey, JSON.stringify(exampleKeys));
            }, this);
    },

    /**
     * Sends file to storage
     * @param {String} filePath - path to source file
     * @param {Number} attempt - number of attempt
     * @returns {*}
     * @private
     */
    _sendFile: function (filePath, attempt) {
        var basePath = process.cwd(),
            fPath = path.join(basePath, filePath),
            key = util.format('%s/%s/%s', this._target.sourceName, this._target.ref, filePath);

            this._logger.verbose('send file %s', fPath);
            return vowFs
                .read(fPath, 'utf-8')
                .then(function (content) {
                    if (content && content.length) {
                        return storage.get(this._target.getOptions().storage).writeP(key, content);
                    } else {
                        this._logger.warn('content is empty for file %s', fPath);
                        return vow.resolve();
                    }
                }, this)
                .then(function () {
                    return key;
                })
                .fail(function (error) {
                    this._logger.warn('Error occur while sending %s to mds for attempt %s', filePath, attempt);
                    if (attempt < this.RETRY_AMOUNT) {
                        return this._sendFile(filePath, ++attempt);
                    } else {
                        this._logger.error(error.message);
                        throw error;
                    }
                }, this);
    }
});
