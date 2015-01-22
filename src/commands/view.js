'use strict';

var util = require('util'),

    _ = require('lodash'),

    config = require('../config'),
    logger = require('../logger'),
    TargetView = require('../targets/view');

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
            var target = new TargetView(opts.repo, opts.version, _.extend({ isCli: true }, config.get('storage')));
            return target.execute()
                .then(function () {
                    logger.info('VIEW COMMAND HAS BEEN FINISHED SUCCESSFULLY', module);
                    process.exit(0);
                })
                .fail(function (err) {
                    logger.error(util.format('VIEW COMMAND FAILED WITH ERROR %s', err.message), module);
                    process.exit(1);
                });
        });
};
