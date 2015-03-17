'use strict';

var _ = require('lodash'),

    config = require('../config'),
    Logger = require('../logger'),
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
            var logger = new Logger(module, 'info'),
                o = _.extend({ isDryRun: opts['dry'] }, { storage: config.get('storage') }),
                target = new TargetRemove(opts.repo, opts.version, o);
            return target.execute()
                .then(function () {
                    logger.info('REMOVE COMMAND HAS BEEN FINISHED SUCCESSFULLY');
                    process.exit(0);
                })
                .fail(function (err) {
                    logger.error('REMOVE COMMAND FAILED WITH ERROR %s', err.message);
                    process.exit(1);
                });
        });
};
