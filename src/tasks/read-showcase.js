var path = require('path'),
    inherit = require('inherit'),
    vow = require('vow'),
    vowFs = require('vow-fs'),
    Base = require('./base');

module.exports = inherit(Base, {
    run: function (result) {
        if (!result.showcase) {
            this._logger.warn('Showcase for %s was not found. This step will be skipped', this._target.name);
            return vow.resolve(result);
        }

        var showCasePath = path.resolve(this._target.getContentPath(), result.showcase.path);
        this._logger.debug('Read showcase file from %s', showCasePath);

        return vowFs.read(showCasePath, 'utf-8')
            .then(function (content) {
                this._logger.debug('Showcase file has been parsed successfully');
                result.showcase.content = content;
                return result;
            }, this)
            .fail(function () {
                this._logger.error('Showcase file was not found or it is invalid');
                result.showcase.content = null;
                return result;
            }, this);
    }
});
