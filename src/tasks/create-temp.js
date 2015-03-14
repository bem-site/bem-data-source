'use strict';

var inherit = require('inherit'),
    vowFs = require('vow-fs'),
    Base = require('./base');

module.exports = inherit(Base, {
    /**
     * Create target folder in output directory
     * @returns {defer.promise|*}
     */
    run: function () {
        this._logger.debug('create temp folder for target %s', this._target.name);
        return vowFs.makeDir(this._target.getTempPath());
    }
});
