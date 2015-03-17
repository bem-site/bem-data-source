var path = require('path'),
    inherit = require('inherit'),
    vowFs = require('vow-fs'),
    constants = require('../constants'),
    Base = require('./base');

module.exports = inherit(Base, {
    /**
     * Saves result model into json file
     * @param {Object} result model
     * @returns {*}
     */
    run: function (result) {
        var fPath = path.resolve(this._target.getContentPath(), constants.FILE.DATA);
        this._logger.debug('write result of target %s to file %s', this._target.name, fPath);
        return vowFs.write(fPath, JSON.stringify(result), { charset: 'utf8' });
    }
});
