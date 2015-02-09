'use strict';

var path = require('path'),
    util = require('util'),

    vow = require('vow'),
    vowFs = require('vow-fs'),
    glob = require('glob'),

    storage = require('../storage'),
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
    glob('**', { cwd: baseDir, nodir: true }, function (err, files) {
        err ? def.reject(err) : def.resolve(files);
    });
    return def.promise();
}

/**
 * Write file to storage
 * @param {TargetPublish} target - target object
 * @param {String} filePath - path to source file
 * @returns {*}
 */
function sendToStorage(target, filePath) {
    var basePath = target.getTempPath(),
        fPath = path.join(basePath, filePath),
        key = util.format('%s/%s/%s', target.getSourceName(), target.ref, filePath);

    return vowFs.isSymLink(fPath)
        .then(function (isSymlink) {
            if (isSymlink) {
                console.log('find symlink %s', filePath);
                return vow.resolve();
            }

            return vowFs
                .read(fPath, 'utf-8')
                .then(function (content) {
                    return storage.get(target.options.storage).writeP(key, content);
                })
                .then(function () {
                    return key;
                });
        });
}

/**
 * Executes copying built folders from content to temp
 * @param {TargetPublish} target for building
 * @returns {defer.promise|*}
 */
module.exports = function (target) {
    var openFilesLimit = target.options.maxOpenFiles || config.get('maxOpenFiles') || constants.MAXIMUM_OPEN_FILES,
        exampleKeys = [];

    if (target.options.isDryRun) {
        logger.info('"Publish" or "Send" command was launched in dry run mode', module);
        logger.warn(util.format(
            'Data for %s %s won\' be sent to storage', this.source, this.ref), module);
    }

    return readFiles(target.getTempPath())
        .then(function (files) {
            if (target.options.ignored) {
                files = files.filter(function (file) {
                    return !target.options.ignored.some(function (pattern) {
                        return file.match(pattern);
                    });
                });
            }

            var portions = utility.separateArrayOnChunks(files, openFilesLimit);

            logger.debug(util.format('example files count: %s', files.length), module);
            logger.debug(util.format('processing will be executed in %s steps', portions.length), module);

            return portions.reduce(function (prev, item, index) {
                prev = prev.then(function () {
                    logger.debug(util.format('send files in range %s - %s',
                        index * openFilesLimit, (index + 1) * openFilesLimit), module);

                    var promises = item.map(function (_item) {
                        // TODO temporary disable compression
                        // return utility.zipFile(path.join(target.getTempPath(), _item)).then(function () {
                            return target.options.isDryRun ? vow.resolve() : sendToStorage(target, _item);
                        // });
                    });

                    return vow.all(promises).then(function (keys) {
                        exampleKeys = exampleKeys.concat(keys);
                        return exampleKeys;
                    });
                });
                return prev;
            }, vow.resolve());
        })
        .then(function () {
            logger.debug('write example registry key', module);
            var examplesRegistryKey = util.format('%s/%s/%s', target.getSourceName(), target.ref, 'examples');
            return target.options.isDryRun ? vow.resolve() :
                storage.get(target.options.storage).writeP(examplesRegistryKey, JSON.stringify(exampleKeys));
        })
        .then(function () {
            return vow.resolve(target);
        });
};
