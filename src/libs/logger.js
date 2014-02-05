/* global toString: false */
'use strict';

var intel = require('intel'),
    config = require('../config');


module.exports = function(module) {
    var name = module ? module.filename.split('/').slice(-2).join('/') : '';

    var logger = intel.getLogger(name);

    logger.setLevel(config.get('logLevel'));
    logger.addHandler(
        new intel.handlers.Console({
            level: intel.VERBOSE,
            formatter: new intel.Formatter({
                format: '[%(date)s] %(levelname)s %(name)s: %(message)s',
                colorize: true
            })
        })
    );

    return logger;
};
