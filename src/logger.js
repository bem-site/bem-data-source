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

/**
 * Returns logger by it name
 * If first arguments is module then add part of module file path to log string
 * @param args - {Arguments}
 * @returns {*}
 */
function getLogger(module) {
    return intel.getLogger(module ? module.filename.split('/').slice(-2).join('/') : '');
}

/**
 * Alias for logging verbose messages
 * @param str - {String} string for logging
 * @param module - {Object} module object
 * @returns {*}
 */
exports.verbose = function(str, module) {
    return getLogger(module).verbose.apply(null, str);
};

/**
 * Alias for logging debug messages
 * @param str - {String} string for logging
 * @param module - {Object} module object
 * @returns {*}
 */
exports.debug = function(str, module) {
    return getLogger(module).debug.apply(null, str);
};

/**
 * Alias for logging info messages
 * @param str - {String} string for logging
 * @param module - {Object} module object
 * @returns {*}
 */
exports.info = function(str, module) {
  return getLogger(module).info.apply(null, str);
};

/**
 * Alias for logging warn messages
 * @param str - {String} string for logging
 * @param module - {Object} module object
 * @returns {*}
 */
exports.warn = function(str, module) {
    return getLogger(module).warn.apply(null, str);
};

/**
 * Alias for logging error messages
 * @param str - {String} string for logging
 * @param module - {Object} module object
 * @returns {*}
 */
exports.error = function(str, module) {
    return getLogger(module).error.apply(null, str);
};
