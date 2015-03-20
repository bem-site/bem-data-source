'use strict';

var util = require('util'),
    config = require('../config'),
    Logger = require('../logger'),
    utility = require('../util'),
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
            var logger = new Logger(module, 'info'),
                target = new TargetView(opts.repo, opts.version, {
                    storage: utility.getStorageConfiguration(config.get('storage'), opts['storage'])
                });
            target.execute()
                .then(function () {
                    logger.info('VIEW COMMAND HAS BEEN FINISHED SUCCESSFULLY');
                })
                .fail(function (err) {
                    logger.error('VIEW COMMAND FAILED WITH ERROR %s', err.message);
                })
                .done();
        });
};
