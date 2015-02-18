'use strict';

var util = require('util'),

    _ = require('lodash'),

    config = require('../config'),
    logger = require('../logger'),
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
            logger.info('PUBLISH:', module);
            logger.info(util.format('repository version %s', opts.version), module);
            var target = new Target(opts.version,
                _.extend({
                    isCli: true,
                    isDryRun: opts.dry,
                    isDocsOnly: opts['docs-only'],
                    examples: opts.examples
                }, { storage: config.get('storage') }));
                target.execute().then(function () {
                    logger.info('PUBLISH COMMAND HAS BEEN FINISHED SUCCESSFULLY', module);
                    process.exit(0);
                })
                .fail(function (err) {
                    logger.error(util.format('PUBLISH COMMAND FAILED WITH ERROR %s', err.message), module);
                    process.exit(1);
                });
        });
};
