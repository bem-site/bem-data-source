'use strict';

var _ = require('lodash'),
    vow = require('vow'),

    common = require('./common'),
    template = require('../template');

module.exports = function (req, res) {
    return vow.all([
            common.getLibraries(req),
            common.getVersions(req)
        ])
        .spread(function (libraries, versions) {
            return template.run(_.extend({ block: 'page' }, {
                libraries: libraries,
                versions: versions
            }), req);
        })
        .then(function (html) {
            res.end(html);
        })
        .fail(function (err) {
            res.status(500).end(err);
        });
};
