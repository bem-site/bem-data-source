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
            logger.info(''.toUpperCase.apply('Try to replace documentation for:'));

            logger.info('repository name: %s', opts.repo);
            logger.info('repository version %s', opts.version);
            logger.info('documentation key %s', opts.doc);
            logger.info('replacement documentation url %s', opts.url);

            require('./replace-doc')(opts.repo, opts.version, opts.doc, opts.url);
        });
};
