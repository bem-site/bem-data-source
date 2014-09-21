'use strict';

var path = require('path'),

    vow = require('vow'),
    vowFs = require('vow-fs'),

    constants = require('../constants'),

    /**
     * Ping middleware handler
     * @param {Object} req - request object
     * @param {Object} res - response object
     */
    index = function (req, res) {
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
        })
        .then(function () {
            res.status(200).json({ fileStructure: result });
        })
        .fail(function (err) {
            res.status(500).send('error ' + err);
        });
    };

exports.index = index;
exports.publish = require('./publish');
exports.getLibraries = require('./get-libraries');
exports.getVersions = require('./get-versions');
exports.replaceDoc = require('./replace-doc');
exports.remove = require('./remove');


