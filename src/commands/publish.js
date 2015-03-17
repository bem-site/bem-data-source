'use strict';

var _ = require('lodash'),

    config = require('../config'),
    Logger = require('../logger'),
    Target = require('../targets/publish');

module.exports = function () {
    return this
        .title('publish command')
        .helpful()
        .opt()
            .name('version').title('Version of repository (tag or branch)')
            .short('v').long('version')
            .end()
        .opt()
            .name('docs-only').title('Publish only documentation files')
            .short('docs-only').long('docs-only')
            .flag()
            .end()
        .opt()
            .name('examples').title('Pattern to example files that should be published to mds')
            .short('e').long('examples')
            .end()
        .opt()
            .name('dry').title('Dry run mode of launch')
            .short('d').long('dry')
            .flag()
            .end()
        .act(function (opts) {
            var logger = new Logger(module, 'info');
            logger.info('PUBLISH:');
            logger.info('repository version %s', opts.version);
            var target = new Target(opts.version,
                _.extend({
                    isCli: true,
                    isDryRun: opts['dry'],
                    isDocsOnly: opts['docs-only'],
                    examples: opts.examples
                }, { storage: config.get('storage') }));
                target.execute().then(function () {
                    logger.info('PUBLISH COMMAND HAS BEEN FINISHED SUCCESSFULLY');
                    process.exit(0);
                })
                .fail(function (err) {
                    logger.error('PUBLISH COMMAND FAILED WITH ERROR %s', err.message);
                    process.exit(1);
                });
        });
};
