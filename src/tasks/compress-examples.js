'use strict';

var fs = require('fs'),
    zlib = require('zlib'),
    path = require('path'),
    util = require('util'),
    vow = require('vow'),
    vowFs = require('vow-fs'),
    glob = require('glob'),

    logger = require('../logger'),
    constants = require('../constants');

/**
 * Read file names in given directory recursively
 * @param {String} baseDir - path to base directory
 * @returns {*}
 */
function readFiles(baseDir) {
    var def = vow.defer();
    glob("**", { cwd: baseDir, nodir: true }, function (err, files) {
        err ? def.reject(err) : def.resolve(files)
    });
    return def.promise();
}

/**
 * Compress given file
 * @param {Target} target - target object
 * @param {String} filePath - path to source file
 * @returns {*}
 */
function zipFile(target, filePath) {
    var basePath = target.getTempPath(),
        sPath = path.join(basePath, filePath),
        dPath = sPath + '.zip';

    return vowFs.isSymLink(sPath)
        .then(function (isSymlink) {
            if(isSymlink) {
                console.log('find symlink %s', filePath);
                return vow.resolve();
            }

            var def = vow.defer(),
                readStream = fs.createReadStream(sPath),
                writeStream = fs.createWriteStream(dPath);

            readStream
                .pipe(zlib.Gzip())
                .pipe(writeStream)
                .on('error', function (err) {
                    logger.warn(util.format('error occur while compressing: %s', filePath), module);
                    def.reject(err);
                })
                .on('close', function () {
                    logger.verbose(util.format('compressed file: %s', filePath), module);
                    fs.rename(dPath, sPath, function (err) {
                        err ? def.reject(err) : def.resolve(filePath);
                    });
                });

            return def.promise();
    });
}

/**
 * Executes copying built folders from content to temp
 * @param {Target} target for building
 * @returns {defer.promise|*}
 */
module.exports = function (target) {
    return readFiles(target.getTempPath())
        .then(function (files) {
            logger.debug(util.format('example files count: %s', files.length), module);
            return vow.all(files.map(function (item) {
                return zipFile(target, item);
            }));
        })
};
