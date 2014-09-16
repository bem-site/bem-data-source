'use strict';

var path = require('path'),
    util = require('util'),

    utility = require('../util'),
    logger = require('../logger'),
    pusher = require('../pusher'),
    constants = require('../constants');

module.exports = function () {
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
            logger.info('TRY TO REMOVE FOR:', module);

            logger.info(util.format('repository name: %s', opts.repo), module);
            logger.info(util.format('repository version %s', opts.version), module);

            var p = path.join(path.join(constants.DIRECTORY.OUTPUT, opts.repo), opts.version);
            logger.debug(util.format('remove directory: %s', p), module);

            return utility.removeDir(p).then(pusher.commitAndPush({
                commitMessage: util.format('Remove version %s from lib %s', opts.version, opts.repo),
                successMessage: 'REMOVE COMMAND HAS BEEN FINISHED SUCCESSFULLY',
                errorMessage: 'REMOVE COMMAND FAILED WITH ERROR %s'
            }));
        });
};
