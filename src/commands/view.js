'use strict';

var config = require('../config'),
    Logger = require('../logger'),
    TargetView = require('../targets/view/cli');

module.exports = function () {
    return this
        .title('view command')
        .helpful()
        .opt()
            .name('repo').title('Name of repository')
            .short('r').long('repo')
            .end()
        .opt()
            .name('version').title('Version of repository (tag or branch)')
            .short('v').long('version')
            .end()
        .act(function (opts) {
            var logger = new Logger(module, 'info'),
                target = new TargetView(opts.repo, opts.version, { storage: config.get('storage') });
            return target.execute()
                .then(function () {
                    logger.info('VIEW COMMAND HAS BEEN FINISHED SUCCESSFULLY');
                    process.exit(0);
                })
                .fail(function (err) {
                    logger.error('VIEW COMMAND FAILED WITH ERROR %s', err.message);
                    process.exit(1);
                });
        });
};
