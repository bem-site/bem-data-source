'use strict';

var vow = require('vow'),
    inherit = require('inherit'),
    fsExtra = require('fs-extra'),
    Base = require('./base');

module.exports = inherit(Base, {
    /**
     * Remove target folder in output directory
     * @returns {defer.promise|*}
     */
    run: function () {
        this._logger.debug('remove temp folder for target %s', this._target.name);
        return this._removeDir(this._target.getTempPath());
    },

    /**
     * Removes directory with all files and subdirectories
     * @param {String} path to directory on filesystem
     * @returns {*}
     */
    _removeDir: function (path) {
        var def = vow.defer();
        fsExtra.remove(path, function (err) {
            err ? def.reject(err) : def.resolve();
        });
        return def.promise();
    }
});
