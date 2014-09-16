'use strict';

var util = require('util'),
    path = require('path'),
    zlib = require('zlib'),

    fstream = require('fstream'),
    request = require('request'),
    tar = require('tar'),
    vow = require('vow'),
    vowFs = require('vow-fs'),

    config = require('../config'),
    logger = require('../logger'),
    commander = require('../commander'),
    constants = require('../constants');

module.exports = function (target) {
    var copyDataFile = function () {
        return vowFs.copy(
            path.join(target.getOutputPath(), constants.FILE.DATA),
            path.join(path.join(target.getOutputPath(), constants.DIRECTORY.TEMP), constants.FILE.DATA)
        );
    };

    return vowFs.makeDir(path.join(target.getOutputPath(), constants.DIRECTORY.TEMP))
        .then(function () {
            return vow.all([copyDataFile()].concat(target.getCopyPatterns()
                .filter(function (item) {
                    return item !== target.getDocPatterns();
                }).map(function (item) {
                    return commander.runCommand(
                        util.format('cp -R %s %s', item,
                            path.resolve(target.getOutputPath(), constants.DIRECTORY.TEMP)),
                    { cwd: path.resolve(target.getContentPath()) }, util.format('copy folders %s', item), null);
                })
            ));
        })
        .then(function () {
            var def = vow.defer(),
                host = config.get('server:host') || '127.0.0.1',
                port = config.get('server:port') || 3000,
                url = util.format('http://%s:%s/publish/%s/%s', host, port, target.getSourceName(), target.ref);

            fstream.Reader({ path: path.join(target.getOutputPath(), constants.DIRECTORY.TEMP), type: 'Directory' })
                .pipe(tar.Pack())
                .pipe(zlib.Gzip())
                .pipe(request.post(url))
                .on('error', function (err) {
                    logger.error(util.format('publish tarball error %s', err), module);
                    def.reject(err);
                })
                .on('end', function () {
                    logger.info(util.format('publish tarball send to %s', url), module);
                    def.resolve(target);
                });

            return def.promise();
        });
};
