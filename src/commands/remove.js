'use strict';

var path = require('path'),
    util = require('util'),

    vow = require('vow'),

    utility = require('../util'),
    logger = require('../logger'),
    pusher = require('../pusher'),
    constants = require('../constants');

function _remove (repo, version, needToCommit) {
    logger.info('TRY TO REMOVE FOR:', module);
    logger.debug(util.format('repository name: %s', repo), module);
    logger.debug(util.format('repository version %s', version), module);

    var p = path.join(path.join(constants.DIRECTORY.OUTPUT, repo), version);
    logger.debug(util.format('remove directory: %s', p), module);

    return utility.removeDir(p).then(function () {
        if (needToCommit) {
            return pusher.commitAndPush({
                commitMessage: util.format('Remove version %s from lib %s', version, repo),
                successMessage: 'REMOVE COMMAND HAS BEEN FINISHED SUCCESSFULLY',
                errorMessage: 'REMOVE COMMAND FAILED WITH ERROR %s'
            })();
        } else {
            return vow.resolve();
        }
    });
}

module.exports = {

    remove: function (repo, version) {
        return _remove(repo, version, false);
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
                return _remove(opts.repo, opts.version, true);
            });
    }
};
