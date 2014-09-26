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
    constants = require('../constants');

module.exports = function (target) {
    var copyDataFile = function () {
        return vowFs.copy(
            path.join(target.getOutputPath(), constants.FILE.DATA),
            path.join(path.join(target.getOutputPath(), constants.DIRECTORY.TEMP), constants.FILE.DATA)
        );
    };

    return copyDataFile().then(function () {
        var def = vow.defer(),
            options = target.getOptions() || config.get('server') || {
                host: '127.0.0.1',
                port: 3000
            },
            host = options.host,
            port = options.port,
            url = util.format('http://%s:%s/publish/%s/%s', host, port, target.getSourceName(), target.ref);

        if(target.isDryRun) {
            logger.info('Publish command was launched in dry run mode', module);
            logger.info(util.format('Tarball data should be loaded to host: %s  port: %s', host, port), module);
            return vow.resolve();
        }

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
