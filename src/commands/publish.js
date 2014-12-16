'use strict';

var util = require('util'),

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
            .name('dry').title('Dry run mode of launch')
            .short('d').long('dry')
            .flag()
            .end()
        .act(function (opts) {
            logger.info('PUBLISH:', module);
            logger.info(util.format('repository version %s', opts.version), module);
            var target = new Target(opts.version, { isCli: true, isDryRun: opts.dry });
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
