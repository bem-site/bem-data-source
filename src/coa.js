'use strict';

var logger = require('./libs').logger(module);

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
        .name('private').title('privacy of repository')
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
    .act(function(opts, args) {
        logger.info('Try to build sets for:');
        logger.info('repository privacy: %s', opts.private);
        logger.info('repository user or organization: %s', opts.user);
        logger.info('repository name: %s', opts.repo);
        logger.info('repository refs %s', opts.tags || opts.branches);

        if(!opts.tags && !opts.branches) {
            logger.error('Tags or branches have not been set');
            return;
        }

        require('./make.js').run({
            isPrivate: opts.private,
            user: opts.user,
            name: opts.repo,
            tags: opts.tags || [],
            branches: opts.branches || []
        });
    });