'use strict';

var util = require('util'),

    _ = require('lodash'),

    config = require('../config'),
    logger = require('../logger'),
    TargetReplace = require('../targets/replace');

module.exports = function () {
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
            .name('lang').title('Document language: ru|en|...')
            .short('l').long('lang')
            .end()
        .opt()
            .name('url').title('Github url of file with replacement content')
            .short('u').long('url')
            .req()
            .end()
        .act(function (opts) {
            var target = new TargetReplace(opts.repo, opts.version, _.extend({
                isCli: true,
                doc: opts.doc,
                lang: opts.lang,
                url: opts.url
            }, { storage: config.get('storage') }));
            return target.execute()
                .then(function () {
                    logger.info('REPLACE COMMAND HAS BEEN FINISHED SUCCESSFULLY', module);
                    process.exit(0);
                })
                .fail(function (err) {
                    logger.error(util.format('REPLACE COMMAND FAILED WITH ERROR %s', err.message), module);
                    process.exit(1);
                });
        });
};
