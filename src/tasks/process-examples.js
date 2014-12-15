'use strict';

var fs = require('fs'),
    zlib = require('zlib'),
    path = require('path'),
    util = require('util'),

    vow = require('vow'),
    vowFs = require('vow-fs'),
    glob = require('glob'),

    storage = require('../cocaine/api'),
    config = require('../config'),
    logger = require('../logger'),
    utility = require('../util'),
    constants = require('../constants');

/**
 * Read file names in given directory recursively
 * @param {String} baseDir - path to base directory
 * @returns {*}
 */
function readFiles(baseDir) {
    var def = vow.defer();
    glob("**", { cwd: baseDir, nodir: true }, function (err, files) {
        err ? def.reject(err) : def.resolve(files);
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
 * Write file to cocaine storage
 * @param {Target} target - target object
 * @param {String} filePath - path to source file
 * @returns {*}
 */
function sendToStorage(target, filePath) {
    var basePath = target.getTempPath(),
        fPath = path.join(basePath, filePath),
        key = util.format('%s/%s/%s', target.getSourceName(), target.ref, filePath);

    return vowFs.isSymLink(fPath)
        .then(function (isSymlink) {
            if(isSymlink) {
                console.log('find symlink %s', filePath);
                return vow.resolve();
            }

            return vowFs.read(fPath).then(function(content) {
                return storage.write(key, content, [target.getSourceName(), target.ref]);
            });
        });
}

/**
 * Executes copying built folders from content to temp
 * @param {Target} target for building
 * @returns {defer.promise|*}
 */
module.exports = function (target) {
    var openFilesLimit = config.get('maxOpenFiles') || constants.MAXIMUM_OPEN_FILES;

    return storage.init()
        .then(function() {
            return readFiles(target.getTempPath());
        })
        .then(function (files) {
            //TODO remove this filter!
            files = files.filter(function(file) {
                if (file.match(/README\.md$/)) {
                    //console.log('ignore readme %s', file);
                    return false;
                }
                if (file.match(/desktop\.sets\/(\.bem|catalogue|index|jscatalogue)/)) {
                    //console.log('ignore folders %s', file);
                    return false;
                }
                if (file.match(/\/\.bem\//)) {
                    //console.log('ignore .bem %s', file);
                    return false;
                }
                if (file.match(/data\.json$/)) {
                    //console.log('ignore data.json %s', file);
                    return false;
                }

                return true;
            });

            var portions = utility.separateArrayOnChunks(files, openFilesLimit);

            logger.debug(util.format('example files count: %s', files.length), module);
            logger.debug(util.format('compression will be executed in %s steps', portions.length), module);

            return portions.reduce(function (prev, item, index) {
                prev = prev.then(function () {
                    logger.debug(util.format('compress and send files in range %s - %s',
                        index * openFilesLimit, (index + 1) * openFilesLimit), module);

                    return vow.all(item.map(function (_item) {
                        return zipFile(target, _item)
                            .then(function() {
                                return sendToStorage(target, _item);
                            });
                    }));
                });
                return prev;
            }, vow.resolve());
        })
        .then(function() {
            return vow.resolve(target);
        });
};
