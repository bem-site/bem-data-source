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

        return vowNode.promisify(glob)('**', { cwd: this._target.getTempPath(), nodir: true })
            .then(function (files) {
                if (o.examples) {
                    files = files.filter(function (file) {
                        return file.indexOf(o.examples) > -1;
                    }, this);
                }

                this._logger.debug('example files count: %s', files.length);

                var _this = this;

                return _.chunk(files, ofl).reduce(function (prev, item, index, arr) {
                    _this._logger.debug('processing will be executed in %s steps', arr.length);
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
        var basePath = this._target.getTempPath(),
            fPath = path.join(basePath, filePath),
            key = util.format('%s/%s/%s', this._target.sourceName, this._target.ref, filePath);

        return vowFs.isSymLink(fPath)
            .then(function (isSymlink) {
                if (isSymlink) {
                    this._logger.verbose('find symlink %s', filePath);
                    return vow.resolve();
                }

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
            }, this);
    }
});
