'use strict';

var util = require('util'),

    _ = require('lodash'),

    config = require('../config'),
    logger = require('../logger'),
    TargetRemove = require('../targets/remove');

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
        .opt()
            .name('dry').title('Dry run mode of launch')
            .short('d').long('dry')
            .flag()
            .end()
        .act(function (opts) {
            var target = new TargetRemove(opts.repo, opts.version,
                _.extend({ isDryRun: opts.dry }, { storage: config.get('storage') }));
            return target.execute()
                .then(function () {
                    logger.info('REMOVE COMMAND HAS BEEN FINISHED SUCCESSFULLY', module);
                    process.exit(0);
                })
                .fail(function (err) {
                    logger.error(util.format('REMOVE COMMAND FAILED WITH ERROR %s', err.message), module);
                    process.exit(1);
                });
        });
};
