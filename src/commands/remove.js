'use strict';

var path = require('path'),
    util = require('util'),

    vow = require('vow'),
    request = require('request'),

    utility = require('../util'),
    logger = require('../logger'),
    pusher = require('../pusher'),
    config = require('../config'),
    constants = require('../constants');

function _removeLocal (repo, version) {
    logger.info('TRY TO REMOVE FOR:', module);
    logger.debug(util.format('repository name: %s', repo), module);
    logger.debug(util.format('repository version %s', version), module);

    var p = path.join(path.join(constants.DIRECTORY.OUTPUT, repo), version);
    logger.debug(util.format('remove directory: %s', p), module);

    return utility.removeDir(p).then(function () {
        return pusher.commitAndPush({
            commitMessage: util.format('Remove version %s from lib %s', version, repo),
            successMessage: 'REMOVE COMMAND HAS BEEN FINISHED SUCCESSFULLY',
            errorMessage: 'REMOVE COMMAND FAILED WITH ERROR %s'
        })();
    });
}

function _removeRemote (repo, version, options, isDryRun) {
    options = options || config.get('server') || {
        host: '127.0.0.1',
        port: 3000
    };
    version = version.replace(/\//g, '-');

    var def = vow.defer(),
        host = options.host,
        port = options.port,
        url = util.format('http://%s:%s/remove/%s/%s', host, port, repo, version);

    if (isDryRun) {
        logger.info('Remove command was launched in dry run mode', module);
        logger.info(util.format('Data for %s %s should be removed from host: %s  port: %s',
            repo, version, host, port), module);
        return vow.resolve();
    }

    request.post(url, function (err) {
        if (err) {
            logger.error(util.format('remove command error %s', err), module);
            def.reject(err);
        } else {
            logger.info(util.format('remove command send to %s', url), module);
            def.resolve();
        }
    });

    return def.promise();
}

module.exports = {

    remove: function (repo, version, options, isDryRun) {
        return _removeRemote(repo, version, options, isDryRun)
            .then(function () {
                logger.info('REMOVE COMMAND HAS BEEN FINISHED SUCCESSFULLY', module);
            })
            .fail(function (err) {
                logger.error(util.format('REMOVE COMMAND FAILED WITH ERROR %s', err.message), module);
                process.exit(1);
            });
    },

    cmd: function () {
        return this
            .title('remove command')
            .helpful()
            .opt()
                .name('repo').title('Name of repository')
                .short('r').long('repo')
                .req()
                .end()
            .opt()
                .name('version').title('Version of repository (tag or branch)')
                .short('v').long('version')
                .req()
                .end()
            .act(function (opts) {
                return _removeLocal(opts.repo, opts.version);
            });
    }
};
