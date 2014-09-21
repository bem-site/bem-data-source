'use strict';

var path = require('path'),

    _ = require('lodash'),
    vow = require('vow'),
    vowFs = require('vow-fs'),

    constants = require('../constants'),
    template = require('../template');

function getData () {
    var result = [],
        p = path.join(process.cwd(), constants.DIRECTORY.OUTPUT);

    return vowFs.listDir(p).then(function (libs) {
        return vow.all(libs.map(function (item) {
            return vowFs.isDir(path.join(p, item)).then(function (isDir) {
                return (isDir && ['.git', 'freeze'].indexOf(item) === -1) ?
                    vowFs.listDir(path.join(p, item)).then(function (versions) {
                        result.push({
                            lib: item,
                            versions: versions.filter(function (v) { return v !== '.DS_Store'; })
                        });
                    }) : vow.resolve();
            });
        }));
    }).then(function() {
        return result;
    });
}

/**
 * Ping middleware handler
 * @param {Object} req - request object
 * @param {Object} res - response object
 */
function index (req, res) {
    return getData()
        .then(function (result) {
            return template.run(_.extend({ block: 'page' }, { data: result }));
        })
        .then(function(html) {
            res.end(html);
        })
        .fail(function(err) {
            res.status(500).end(err);
        });
}

exports.index = index;
exports.publish = require('./publish');
exports.replaceDoc = require('./replace-doc');
exports.remove = require('./remove');


