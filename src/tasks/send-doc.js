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
        var
            lib = this._target.sourceName,
            version = this._target.ref,
            shaKey = null;

            return this._writeDataFile(lib, version, shaKey).then(function () {
                return this._modifyRegistry(lib, version, shaKey);
            }, this);
    },

    /**
     * Writes data.json file with documentation to storage
     * @param {String} lib - name of library
     * @param {String} version - name of library version
     * @param {String} shaKey unique shasum of file content
     * @returns {*}
     * @private
     */
    _writeDataFile: function (lib, version, shaKey) {
        var fPath = path.join(this._target.contentPath, constants.FILE.DATA),
            key = util.format('%s/%s/%s', lib, version, constants.FILE.DATA);
        return vowFs.read(fPath, 'utf-8')
            .then(function (content) {
                try {
                    shaKey = sha(content);
                }catch (err) {
                    shaKey = sha(util.format('%s:%s:%s', lib, version, (new Date()).toString()));
                }
                return this._target.options.isDryRun ? vow.resolve() :
                    storage.get(this._target.options.storage).writeP(key, content);
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
        return storage.get(this._target.options.storage).readP(constants.ROOT)
            .then(function (registry) {
                registry = registry ? JSON.parse(registry) : {};
                registry[lib] = registry[lib] || { name: lib, versions: {} };

                this._logger.debug(util.format('registry: %s', JSON.stringify(registry[lib])), module);

                registry[lib].versions[version] = { sha: shaKey, date: +(new Date()) };
                return this._target.options.isDryRun ? vow.resolve() :
                    storage.get(this._target.options.storage).writeP(constants.ROOT, JSON.stringify(registry));
            }, this);
    }
});
