'use strict';

var util = require('util'),
    path = require('path'),
    zlib = require('zlib'),

    tar = require('tar'),
    vow = require('vow'),
    vowFs = require('vow-fs'),

    pusher = require('../pusher'),
    logger = require('../logger'),
    commander = require('../commander'),
    constants = require('../constants'),
    utility = require('../util');

/**
 * Moves files from /output/{lib}/{version}/temp folder to /output/{lib}/{version} folder
 * @param {String} versionPath - folder of lib version in output directory
 * @returns {*}
 */
function moveFromTemp (versionPath) {
    var tmpDir = path.join(versionPath, constants.DIRECTORY.TEMP);
    return commander.moveFiles(tmpDir, versionPath)
        .then(function () {
            return utility.removeDir(tmpDir);
        });
}

/**
 * Post data middleware handler
 * @param {Object} req - request object
 * @param {Object} res - response object
 */
module.exports = function (req, res) {
    var p = path.join(process.cwd(), constants.DIRECTORY.OUTPUT);

    p = path.join(p, req.params.lib);
    p = path.join(p, req.params.version);

    vowFs.exists(p).then(function (isExists) {
        var promise = isExists ? utility.removeDir(p) : vow.resolve();

        promise.then(function () {
            vowFs.makeDir(p).then(function () {
                req
                    .pipe(zlib.Gunzip())
                    .pipe(tar.Extract({ path: p }))
                    .on('error', function (err) {
                        res.status(500).send('error ' + err);
                    })
                    .on('end', function () {
                        logger.debug(util.format('File has been extracted to path', p), module);
                        return moveFromTemp(p)
                            .then(function () {
                                pusher.chargeForPush();
                                res.status(200).send('ok');
                            })
                            .fail(function (err) {
                                res.status(500).send('error ' + err);
                            });
                    });
            });
        });
    });
};
