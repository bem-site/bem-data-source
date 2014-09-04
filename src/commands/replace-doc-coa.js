'use strict';

var logger = require('../logger');

module.exports = function() {

    return this
        .title('replace doc command')
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
        .opt()
            .name('doc').title('Document key: readme|changelog|migration|notes')
            .short('d').long('doc')
            .req()
            .end()
        .opt()
            .name('url').title('Github url of file with replacement content')
            .short('u').long('url')
            .req()
            .end()
        .act(function(opts) {
            logger.info(''.toUpperCase.apply('Try to build sets for:'));

            logger.info('repository privacy: %s', !!opts.private);
            logger.info('repository user or organization: %s', opts.user);
            logger.info('repository name: %s', opts.repo);
            logger.info('repository refs %s', opts.tags || opts.branches);
            logger.info('only docs %s', !!opts.docsOnly);

            if (!opts.tags && !opts.branches) {
                logger.error('Tags or branches have not been set');
                return;
            }

            require('./make')({
                isPrivate: !!opts.private,
                user: opts.user,
                name: opts.repo,
                tags: opts.tags || [],
                branches: opts.branches || [],
                docsOnly: !!opts.docsOnly
            });
        });
};
