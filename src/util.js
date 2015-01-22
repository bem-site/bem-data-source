'use strict';

var fs = require('fs'),
    util = require('util'),
    zlib = require('zlib'),

    md = require('marked'),
    vow = require('vow'),
    vowFs = require('vow-fs'),
    Rsync = require('rsync'),
    fsExtra = require('fs-extra'),

    renderer = require('./renderer'),
    logger = require('./logger');

/**
 * Converts markdown content into html with marked module
 * @param {String} content of markdown file
 * @returns {String} - html string
 */
exports.mdToHtml = function (content) {
    return md(content, {
        gfm: true,
        pedantic: false,
        sanitize: false,
        renderer: renderer.get()
    });
};

/**
 * Removes directory with all files and subdirectories
 * @param {String} path to directory on filesystem
 * @returns {*}
 */
exports.removeDir = function (path) {
    var def = vow.defer();
    fsExtra.remove(path, function (err) {
        if (err) {
            def.reject(err);
        }
        def.resolve();
    });

    return def.promise();
};

/**
 * Copy file from target path to destination path
 * @param {String} target path
 * @param {String} destination path
 * @returns {*}
 */
exports.copy = function (target, destination) {
    var def = vow.defer();
    fsExtra.copy(target, destination, function (err) {
        if (err) {
            def.reject(err);
        }
        def.resolve();
    });

    return def.promise();
};

/**
 * Runs rsync command with options
 * @param {Object} options - options for rsync command
 * @returns {*}
 */
exports.rsync = function (options) {
    var def = vow.defer(),
        rsync = Rsync.build(options);

    rsync.set('safe-links');
    rsync.set('copy-links');
    logger.debug(util.format('rsync command: %s', rsync.command()), module);
    rsync.execute(function (err, code) {
            if (err) {
                logger.error(util.format('Rsync failed wit error %s', err.message), module);
                def.reject(err);
            }else {
                def.resolve(code);
            }
        },
        function (data) {
            logger.debug(data.toString(), module);
        },
        function (data) {
            logger.warn(data.toString(), module);
        }
    );
    return def.promise();
};

/**
 * Separates array into small array with given chunkSize length
 * @param {Array} arr - array for separate
 * @param {Number} chunkSize - size of chunk
 * @returns {Array}
 */
exports.separateArrayOnChunks = function (arr, chunkSize) {
    var _arr = arr.slice(0),
        arrays = [];

    while (_arr.length > 0) {
        arrays.push(_arr.splice(0, chunkSize));
    }

    return arrays;
};

/**
 * Compress given file
 * @param {String} filePath - path to source file
 * @returns {*}
 */
exports.zipFile = function (filePath) {
    var sPath = filePath,
        dPath = sPath + '.zip';

    return vowFs.isSymLink(sPath)
        .then(function (isSymlink) {
            if (isSymlink) {
                return vow.resolve();
            }

            var def = vow.defer(),
                readStream = fs.createReadStream(sPath),
                writeStream = fs.createWriteStream(dPath);

            readStream
                .pipe(zlib.createGzip())
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
};
