'use strict';

var path = require('path'),
    util = require('util'),

    vow = require('vow'),
    vowFs = require('vow-fs'),
    inherit = require('inherit'),
    glob = require('glob'),

    storage = require('../storage'),
    config = require('../config'),
    utility = require('../util'),
    constants = require('../constants'),
    Base = require('./base');

module.exports = inherit(Base, {

    run: function () {
        var openFilesLimit = this._target.options['maxOpenFiles'] ||
                config.get('maxOpenFiles') || constants.MAXIMUM_OPEN_FILES,
            exampleKeys = [];

        if (this._target.options.isDryRun) {
            this._logger.info('"Publish" or "Send" command was launched in dry run mode');
            this._logger.warn(
                'Data for %s %s won\' be sent to storage', this._target.sourceName, this._target.ref);
        }

        if (this._target.options.isDocsOnly) {
            this._logger.warn('"Publish" commands was launched with enabled flag docs-only. ' +
            'Examples will not be sent to mds storage');
            return vow.resolve();
        }

        return this._readFiles(this._target.tempPath)
            .then(function (files) {
                // TODO this condition is needed for convertation script
                /*
                if (this._target.options.ignored) {
                    files = files.filter(function (file) {
                        return !this._target.options.ignored.some(function (pattern) {
                            return file.match(pattern);
                        });
                    });
                }
                */

                if (this._target.options.examples) {
                    files = files.filter(function (file) {
                        return file.indexOf(this._target.options.examples) > -1;
                    }, this);
                }

                var portions = utility.separateArrayOnChunks(files, openFilesLimit);

                this._logger.debug('example files count: %s', files.length);
                this._logger.debug('processing will be executed in %s steps', portions.length);

                var _this = this;
                return portions.reduce(function (prev, item, index) {
                    prev = prev.then(function () {
                        this._logger.verbose('send files in range %s - %s',
                            index * openFilesLimit, (index + 1) * openFilesLimit);

                        var promises = item.map(function (_item) {
                            return this._target.options.isDryRun ? vow.resolve() : this._sendFile(_item);
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
                return this._target.options.isDryRun ? vow.resolve() :
                    storage.get(this._target.options.storage).writeP(examplesRegistryKey, JSON.stringify(exampleKeys));
            }, this);
    },

    /**
     * Read file names in given directory recursively
     * @param {String} baseDir - path to base directory
     * @returns {*}
     * @private
     */
    _readFiles: function (baseDir) {
        var def = vow.defer();
        glob('**', { cwd: baseDir, nodir: true }, function (err, files) {
            err ? def.reject(err) : def.resolve(files);
        });
        return def.promise();
    },

    /**
     * Sends file to storage
     * @param {String} filePath - path to source file
     * @returns {*}
     * @private
     */
    _sendFile: function (filePath) {
        var basePath = this._target.tempPath,
            fPath = path.join(basePath, filePath),
            key = util.format('%s/%s/%s', this._target.sourceName, this._target.ref, filePath);

        return vowFs.isSymLink(fPath)
            .then(function (isSymlink) {
                if (isSymlink) {
                    this._logger.verbose('find symlink %s', filePath);
                    return vow.resolve();
                }

                return vowFs
                    .read(fPath, 'utf-8')
                    .then(function (content) {
                        if (content && content.length) {
                            return storage.get(this._target.options.storage).writeP(key, content);
                        } else {
                            this._logger.warn('content is empty for file %s', fPath);
                            return vow.resolve();
                        }
                    }, this)
                    .then(function () {
                        return key;
                    })
                    .fail(function (error) {
                        this._logger.error('Error occur while sending file %s to mds', filePath);
                        this._logger.error(error.message);
                        throw error;
                    }, this);
            });
    }
});
