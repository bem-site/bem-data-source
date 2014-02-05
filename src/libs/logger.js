/* global toString: false */
'use strict';

var intel = require('intel'),
    config = require('../config');

intel.setLevel(config.get('logLevel'));
intel.addHandler(
    new intel.handlers.Console({
        level: intel.VERBOSE,
        formatter: new intel.Formatter({
            format: '[%(date)s] %(levelname)s %(name)s: %(message)s',
            colorize: true
        })
    })
);

module.exports = function(module) {
    var name = module ? module.filename.split('/').slice(-2).join('/') : '';
    return intel.getLogger(name);
};
