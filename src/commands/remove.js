'use strict';

var util = require('util'),
    _ = require('lodash'),

    config = require('../config'),
    Logger = require('../logger'),
    utility = require('../util'),
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
            logger.info('REMOVE:');
            logger.info('library name: %s', opts['repo']);
            logger.info('library version: %s', opts['ref']);
            logger.info('dry mode is set to %s', opts['dry']);
            logger.info('storage environment: %s', opts['storage']);

            var target,
                o = _.extend({ isDryMode: opts['dry'] },
                    { storage: utility.getStorageConfiguration(config.get('storage'), opts['storage']) });
            target = new TargetRemove(opts.repo, opts.version, o);
            target.execute()
                .then(function () {
                    logger.info('REMOVE COMMAND HAS BEEN FINISHED SUCCESSFULLY');
                })
                .fail(function (err) {
                    logger.error('REMOVE COMMAND FAILED WITH ERROR %s', err.message);
                })
                .done();
        });
};
