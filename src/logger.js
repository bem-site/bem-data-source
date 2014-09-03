'use strict';

var intel = require('intel'),
    config = require('./config');

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

exports.verbose = function(args) {
    return intel.getLogger('').verbose.apply(null, args);
};

exports.debug = function(args) {
    return intel.getLogger('').debug.apply(null, args);
};

exports.info = function(args) {
  return intel.getLogger('').info.apply(null, args);
};

exports.warn = function(args) {
    return intel.getLogger('').warn.apply(null, args);
};

exports.error = function(args) {
    return intel.getLogger('').error.apply(null, args);
};
