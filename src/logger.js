'use strict';

var util = require('util'),
    chalk = require('chalk'),
    moment = require('moment'),
    Logger = function (module, level) {
        this._init(module, level);
    };

Logger.prototype = {

    _DEFAULT_LOG_MODE: 'testing',
    _DEFAULT_LOG_LEVEL: 'info',
    _STYLES: {
        verbose: ['magenta'],
        debug: ['cyan'],
        info: ['green'],
        warn: ['bold', 'yellow'],
        error: ['bold', 'red']
    },

    _mode: undefined,
    _level: undefined,
    _options: undefined,
    _logger: undefined,
    _prefixString: undefined,
    _styleString: undefined,

    /**
     * Logger initialization function
     * @param {Module} moduleForLog that uses this logger instance
     * @param {String} level - logger level (verbose|debug|info|warn|error)
     * @private
     */
    _init: function (moduleForLog, level) {
        this._mode = process.env.NODE_ENV || this._DEFAULT_LOG_MODE;
        this._level = level || this._DEFAULT_LOG_LEVEL;
        this._options = {};

        if (this._mode === 'testing') {
            this._logger = {
                verbose: function () {},
                debug: function () {},
                info: function () {},
                warn: console.warn,
                error: console.error
            };
        } else {
            var _this = this;
            this._logger = ['verbose', 'debug', 'info', 'warn', 'error'].reduce(function (prev, item, index, arr) {
                prev[item] = arr.slice(0, index + 1).indexOf(_this._level) > -1 ?
                    (console[item] || console.log) : function () {};
                return prev;
            }, {});

            if (this._mode === 'development') {
                this._options.color = true;
                this._options.useDate = true;
            }
        }

        this._styleString = function (s, styles) {
            if (!this._options.color) {
                return s;
            }
            var f = styles.reduce(function (prev, item) {
                prev = prev[item];
                return prev;
            }, chalk);
            return f(s);
        };

        this._prefixString = function (level) {
            var prefix = '';
            if (this._options.useDate) {
                prefix = '[' + moment().format('YYYY-MM-DD HH:mm:SS') + ']';
            }
            prefix += ' ' + level.toUpperCase() + ' ';
            prefix = this._styleString(prefix, this._STYLES[level]);
            prefix += moduleForLog.parent.filename.split('/').slice(-2).join('/') + ': ';
            return prefix;
        };
    },

    /**
     * Logs given message args with given log level
     * @param {String} level - log level
     * @param {Argument} args - logger arguments
     * @returns {*}
     * @private
     */
    _log: function (level, args) {
        return this._logger.verbose(this._prefixString(level) + util.format.apply(this, args));
    },

    /**
     * Alias for logging verbose messages
     * @returns {*}
     */
    verbose: function () {
        return this._log('verbose', arguments);
    },

    /**
     * Alias for logging debug messages
     * @returns {*}
     */
    debug: function () {
        return this._log('debug', arguments);
    },

    /**
     * Alias for logging info messages
     * @returns {*}
     */
    info: function () {
        return this._log('info', arguments);
    },

    /**
     * Alias for logging warn messages
     * @returns {*}
     */
    warn: function () {
        return this._log('warn', arguments);
    },

    /**
     * Alias for logging error messages
     * @returns {*}
     */
    error: function () {
        return this._log('error', arguments);
    }
};

module.exports = Logger;
