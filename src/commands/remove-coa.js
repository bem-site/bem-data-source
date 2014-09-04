'use strict';

var logger = require('../logger');

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
            logger.info(''.toUpperCase.apply('Try to remove compiled sets for:'));

            logger.info('repository name: %s', opts.repo);
            logger.info('repository version %s', opts.version);

            require('./remove')(opts.repo, opts.version);
        });

};
