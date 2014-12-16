'use strict';

var intel = require('intel'),
    config = require('./config'),

    DEFAULT_MODE = 'single',
    mode;

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

function getMode() {
    return mode || DEFAULT_MODE;
}

/**
 * Returns logger by it name
 * If first arguments is module then add part of module file path to log string
 * @param {Object} module
 * @returns {*}
 */
function getLogger(module) {
    if (getMode() === DEFAULT_MODE) {
        return intel.getLogger(module ? module.filename.split('/').slice(-2).join('/') : '');
    } else {
        return {
            verbose: function () {},
            debug: console.log,
            info: console.info,
            warn: console.warn,
            error: console.error
        };
    }
}

exports.setProductionMode = function () {
    mode = 'api';
};

/**
 * Alias for logging verbose messages
 * @param {String} str (string) for logging
 * @param {Object} module object
 * @returns {*}
 */
exports.verbose = function (str, module) {
    return getLogger(module).verbose(str);
};

/**
 * Alias for logging debug messages
 * @param {String} str (string) for logging
 * @param {Object} module object
 * @returns {*}
 */
exports.debug = function (str, module) {
    return getLogger(module).debug(str);
};

/**
 * Alias for logging info messages
 * @param {String} str (string) for logging
 * @param {Object} module object
 * @returns {*}
 */
exports.info = function (str, module) {
  return getLogger(module).info(str);
};

/**
 * Alias for logging warn messages
 * @param {String} str (string) for logging
 * @param {Object} module object
 * @returns {*}
 */
exports.warn = function (str, module) {
    return getLogger(module).warn(str);
};

/**
 * Alias for logging error messages
 * @param {String} str (string) for logging
 * @param {Object} module object
 * @returns {*}
 */
exports.error = function (str, module) {
    return getLogger(module).error(str);
};
