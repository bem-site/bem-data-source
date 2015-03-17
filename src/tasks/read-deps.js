var path = require('path'),
    inherit = require('inherit'),
    vowFs = require('vow-fs'),
    Base = require('./base');

module.exports = inherit(Base, {
    /**
     * Reads library dependencies from bower.json file
     * @param {Object} result model
     * @returns {*}
     */
    run: function (result) {
        this._logger.info('Read dependencies for target %s', this._target.name);
        return vowFs.read(path.resolve(this._target.getContentPath(), 'bower.json'), 'utf-8')
            .then(function (content) {
                try {
                    content = JSON.parse(content);
                    result.deps = content['dependencies'];
                }catch (e) {
                    this._logger.error('Error occur while parsing bower.json file of %s', this._target.name);
                    result.deps = null;
                }
                return result;
            }, this)
            .fail(function () {
                this._logger.error('Error occur while opening bower.json file for %s', this._target.name);
                result.deps = null;
                return result;
            }, this);
    }
});
