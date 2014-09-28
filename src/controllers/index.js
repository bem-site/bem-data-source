'use strict';

var _ = require('lodash'),

    common = require('./common'),
    template = require('../template');

/**
 * Ping middleware handler
 * @param {Object} req - request object
 * @param {Object} res - response object
 */
function index (req, res) {
    return common.getLibraries(req)
        .then(function (libraries) {
            return template.run(
                _.extend({ block: 'page', view: 'index' },
                    { data: { libraries: libraries }}), req);
        })
        .then(function (html) {
            res.end(html);
        })
        .fail(function (err) {
            res.status(500).end(err);
        });
}

exports.index = index;
exports.lib = require('./lib');
exports.build = require('./build'),
exports.publish = require('./publish');
exports.replaceDoc = require('./replace-doc');
exports.remove = require('./remove');
