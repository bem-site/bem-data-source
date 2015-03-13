var path = require('path'),
    inherit = require('inherit'),
    vow = require('vow'),
    vowFs = require('vow-fs'),
    Base = require('./base');

module.exports = inherit(Base, {
    run: function (result) {
        if (!result.showcase) {
            return vow.resolve(result);
        }
        return vowFs.read(path.resolve(this._target.contentPath, result.showcase.path), 'utf-8')
            .then(function (content) {
                result.showcase.content = content;
                return result;
            })
            .fail(function () {
                result.showcase.content = null;
                return result;
            });
    }
});
