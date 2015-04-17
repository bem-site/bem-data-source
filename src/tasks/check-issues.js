var util = require('util'),
    vow = require('vow'),
    inherit = require('inherit'),
    utility = require('../util'),
    Api = require('../gh-api'),
    Base = require('./base');

module.exports = inherit(Base, {
    run: function (result) {
        var def = vow.defer(),
            gh = new Api({}),
            o = utility.parseGhUrl(util.format('%s/blob/%s/README.md', result.url, result.ref));

        gh.get(o).hasIssues(o, null, function (err, res) {
            if (err) {
                def.reject(err);
            } else {
                result.hasIssues = res;
                def.resolve(result);
            }
        });
        return def.promise();
    }
});
