var util = require('util'),
    _ = require('lodash'),

    config = require('../config'),
    Logger = require('../logger'),
    utility = require('../util'),
    Target = require('../targets/migrate');

module.exports = function () {
    return this
        .title('migrate command')
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
            .name('docs-only').title('Publish only documentation files')
            .short('docs-only').long('docs-only')
            .def(false)
            .flag()
            .end()
        .opt()
            .name('dry').title('Dry run mode of launch')
            .short('d').long('dry')
            .def(false)
            .flag()
            .end()
        .opt()
            .name('from').title('Storage from environment: (testing|production)')
            .short('f').long('from')
            .def('testing')
            .val(function (v) {
                if (['testing', 'production'].indexOf(v) === -1) {
                    this.reject(util.format('%s is not available storage environment', v));
                }
                return v;
            })
            .end()
        .opt()
            .name('to').title('Storage to environment: (testing|production)')
            .short('t').long('to')
            .def('production')
            .val(function (v) {
                if (['testing', 'production'].indexOf(v) === -1) {
                    this.reject(util.format('%s is not available storage environment', v));
                }
                return v;
            })
            .end()
        .act(function (opts) {
            var logger = new Logger(module, 'info');
            logger.info('MIGRATE:');
            logger.info('library name: %s', opts['repo']);
            logger.info('library version: %s', opts['ref']);
            logger.info('docs-only is set to %s', opts['docs-only']);
            logger.info('dry mode is set to %s', opts['dry']);
            logger.info('storage from environment: %s', opts['from']);
            logger.info('storage to environment: %s', opts['to']);

            var target = new Target(opts.repo, opts.version,
                _.extend({
                    isDryRun: opts['dry'],
                    isDocsOnly: opts['docs-only']
                }, {
                    storageFrom: utility.getStorageConfiguration(config.get('storage'), opts['from']),
                    storageTo: utility.getStorageConfiguration(config.get('storage'), opts['to'])
                }));
            target.execute()
                .then(function () {
                    logger.info('MIGRATE COMMAND HAS BEEN FINISHED SUCCESSFULLY');
                })
                .fail(function (err) {
                    logger.error('MIGRATE COMMAND FAILED WITH ERROR %s', err.message);
                })
                .done();
        });
};
