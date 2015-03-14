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
        return vowFs.read(path.resolve(this._target.getContentPath(), 'bower.json'), 'utf-8')
            .then(function (content) {
                try {
                    content = JSON.parse(content);
                    result.deps = content['dependencies'];
                }catch (e) {
                    result.deps = null;
                }
                return result;
            })
            .fail(function () {
                result.deps = null;
                return result;
            });
    }
});
