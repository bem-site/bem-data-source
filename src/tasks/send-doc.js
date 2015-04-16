'use strict';

var util = require('util'),
    path = require('path'),

    vow = require('vow'),
    vowFs = require('vow-fs'),
    inherit = require('inherit'),

    sha = require('sha1'),
    storage = require('../storage'),
    constants = require('../constants'),
    Registry = require('../model/registry'),
    Base = require('./base');

module.exports = inherit(Base, {
    run: function () {
        var lib = this._target.sourceName,
            version = this._target.ref;

        this._logger.info('Save documentation for library %s version %s', lib, version);

            return this._writeDataFile(lib, version).then(function (shaKey) {
                return this._modifyRegistry(lib, version, shaKey);
            }, this);
    },

    _generateShaKey: function (lib, version, content) {
        try {
            return sha(content);
        }catch (err) {
            return sha(util.format('%s:%s:%s', lib, version, (new Date()).toString()));
        }
    },

    /**
     * Writes data.json file with documentation to storage
     * @param {String} lib - name of library
     * @param {String} version - name of library version
     * @returns {*}
     * @private
     */
    _writeDataFile: function (lib, version) {
        var fPath = path.join(this._target.getContentPath(), constants.FILE.DATA),
            key = util.format('%s/%s/%s', lib, version, constants.FILE.DATA),
            o = this._target.getOptions(),
            shaKey;

        this._logger.info('Write data.json file to storage for key %s', key);
        return vowFs.read(fPath, 'utf-8')
            .then(function (content) {
                shaKey = this._generateShaKey(lib, version, content);
                return o.isDryRun ? vow.resolve() :
                    storage.get(o.storage).writeP(key, content);
            }, this)
            .then(function () {
                this._logger.info('Doc "data.json" file has been saved to storage successfully');
                this._logger.debug('Sha sum of saved file: %s', shaKey);
                return shaKey;
            }, this);
    },

    /**
     * Modify storage registry
     * @param {String} lib - name of library
     * @param {String} version - name of library version
     * @param {String} shaKey unique shasum of file content
     * @returns {*}
     * @private
     */
    _modifyRegistry: function (lib, version, shaKey) {
        var registry = new Registry(this._target.getOptions());
        return registry.load()
            .then(function () {
                return registry.updateOrCreateVersion(lib, version, shaKey);
            })
            .then(function () {
                return this._target.getOptions().isDryRun ? vow.resolve() : registry.save();
            }, this);
    }
});
