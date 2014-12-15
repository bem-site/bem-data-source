'use strict';

var util = require('util'),

    logger = require('../logger'),
    TargetConvert = require('../targets/convert');

module.exports = function () {
    return this
        .title('convert command')
        .helpful()
        .act(function () {
            var target = new TargetConvert();
            return target.execute()
                .then(function () {
                    logger.info('CONVERT COMMAND HAS BEEN FINISHED SUCCESSFULLY', module);
                    process.exit(0);
                })
                .fail(function (err) {
                    logger.error(util.format('CONVERT COMMAND FAILED WITH ERROR %s', err.message), module);
                    process.exit(1);
                });
        });
};
