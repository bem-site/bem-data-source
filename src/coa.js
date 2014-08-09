'use strict';

var logger = require('./logger')(module);

module.exports = require('coa').Cmd()
    .name(process.argv[1])
    .title('Library data builder')
    .helpful()
    .opt()
        .name('version').title('Show version')
        .short('v').long('version')
        .flag()
        .only()
        .act(function() {
            var p = require('../package.json');
            return p.name + ' ' + p.version;
        })
        .end()
    .opt()
        .name('private').title('Privacy of repository')
        .short('p').long('private')
        .flag()
        .end()
    .opt()
        .name('user').title('User or organization for repository')
        .short('u').long('user')
        .req()
        .end()
    .opt()
        .name('repo').title('Name of repository')
        .short('r').long('repo')
        .req()
        .end()
    .opt()
        .name('tags').title('Name(s) of tags')
        .short('t').long('tags')
        .arr()
        .end()
    .opt()
        .name('branches').title('Name(s) of branches')
        .short('b').long('branches')
        .arr()
        .end()
    .opt()
        .name('docsOnly').title('Indicates that only docs should be collected')
        .short('docs-only').long('docs-only')
        .flag()
        .end()
    .act(function(opts) {
        logger.info(''.toUpperCase.apply('Try to build sets for:'));

        logger.info('repository privacy: %s', !!opts.private);
        logger.info('repository user or organization: %s', opts.user);
        logger.info('repository name: %s', opts.repo);
        logger.info('repository refs %s', opts.tags || opts.branches);
        logger.info('only docs %s', !!opts.docsOnly);

        if(!opts.tags && !opts.branches) {
            logger.error('Tags or branches have not been set');
            return;
        }

        require('./make.js').run({
            isPrivate: !!opts.private,
            user: opts.user,
            name: opts.repo,
            tags: opts.tags || [],
            branches: opts.branches || [],
            docsOnly: !!opts.docsOnly
        });
    });
