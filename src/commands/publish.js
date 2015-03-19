'use strict';

var util = require('util'),
    _ = require('lodash'),

    config = require('../config'),
    Logger = require('../logger'),
    utility = require('../util'),
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
        .opt()
            .name('storage').title('Storage environment: (testing|production)')
            .short('s').long('storage')
            .def('testing')
            .val(function (v) {
                if (['testing', 'production'].indexOf(v) === -1) {
                    this.reject(util.format('%s is not available storage environment', v));
                }
                return v;
            })
            .end()
        .act(function (opts) {
            var logger = new Logger(module, 'info');
            logger.info('PUBLISH:');
            logger.info('library version: %s', opts.version);
            logger.info('dry mode is set to %s', opts['dry']);
            logger.info('docs-only is set to %s', opts['docs-only']);
            logger.info('storage environment: %s', opts['storage']);

            var target = new Target(opts.version,
                _.extend({
                    isCli: true,
                    isDryRun: opts['dry'],
                    isDocsOnly: opts['docs-only'],
                    examples: opts.examples
                }, { storage: utility.getStorageConfiguration(config.get('storage'), opts['storage']) }));
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
