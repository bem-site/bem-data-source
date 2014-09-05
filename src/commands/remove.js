'use strict';

var path = require('path'),
    util = require('util'),

    utility = require('../util'),
    config = require('../config'),
    logger = require('../logger'),
    common = require('./common'),
    constants = require('../constants'),
    commander = require('../commander');

module.exports = function() {

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
        .act(function(opts) {
            logger.info('TRY TO REMOVE FOR:');

            logger.info('repository name: %s', opts.repo);
            logger.info('repository version %s', opts.version);

            var p = path.join(path.join(constants.DIRECTORY.OUTPUT, opts.repo), opts.version);
            logger.debug('remove directory: %s', p);

            return utility.removeDir(p).then(common({
                commitMessage: util.format('Remove version %s from lib %s', opts.version, opts.repo),
                successMessage: 'REMOVE COMMAND HAS BEEN FINISHED SUCCESSFULLY',
                errorMessage: 'REMOVE COMMAND FAILED WITH ERROR %s'
            }));
        });
};
