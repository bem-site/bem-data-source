'use strict';

var util = require('util'),
    path = require('path'),

    vow = require('vow'),
    vowFs = require('vow-fs'),
    inherit = require('inherit'),

    sha = require('sha1'),
    storage = require('../storage'),
    constants = require('../constants'),
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
                try {
                    shaKey = sha(content);
                }catch (err) {
                    shaKey = sha(util.format('%s:%s:%s', lib, version, (new Date()).toString()));
                }
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
        var o = this._target.getOptions();
        return storage.get(o.storage).readP(constants.ROOT)
            .then(function (registry) {
                registry = registry ? JSON.parse(registry) : {};
                registry[lib] = registry[lib] || { name: lib, versions: {} };

                this._logger.debug('registry: %s', JSON.stringify(registry[lib]));

                registry[lib].versions[version] = { sha: shaKey, date: +(new Date()) };
                return o.isDryRun ? vow.resolve() :
                    storage.get(o.storage).writeP(constants.ROOT, JSON.stringify(registry));
            }, this);
    }
});
