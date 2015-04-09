'use strict';

var inherit = require('inherit'),

    storage = require('../../storage'),
    constants = require('../../constants'),
    Logger = require('bem-site-logger');

module.exports = inherit({

    _logger: undefined,
    _source: undefined,
    _ref: undefined,
    _options: undefined,

    /**
     * Initialize target object
     * @param {String} source - name of source (library)
     * @param {String} ref - name of reference (tag, branch, pr)
     * @param {Object} options - advanced options
     * @returns {TargetView}
     */
    __constructor: function (source, ref, options) {
        this._options = options;
        this._source = source;
        this._ref = ref && ref.replace(/\//g, '-');
        this._logger = Logger.setOptions(options.logger).createLogger(module);
    },

    /**
     * Executes target
     * @returns {*}
     */
    execute: function () {
        return storage.get(this._options.storage).readP(constants.ROOT)
            .then(function (registry) {
                var errorMsg;
                if (!registry) {
                   errorMsg  = 'No registry record were found';
                }

                try {
                    registry = JSON.parse(registry);
                } catch (error) {
                    errorMsg = 'Invalid registry record';
                }
                if (errorMsg) {
                    this._logger.warn(errorMsg);
                    throw new Error(errorMsg);
                } else {
                    return registry;
                }
            }, this)
            .then(function (registry) {
                // if no source and version names were given then show list of libraries in registry
                if (!this._source) {
                    return this._getListOfLibraries(registry);
                }

                // check if given library exists in registry
                if (!registry[this._source]) {
                    this._logger.warn('Library %s was not found in registry', this._source);
                    return [];
                }

                if (!this._ref) {
                    return this._getListOfVersions(registry);
                }

                // check if given library version exists in registry
                if (!registry[this._source].versions[this._ref]) {
                    this._logger.warn('Library %s version %s was not found in registry', this._source, this._ref);
                    return null;
                }

                return this._getVersionInfo(registry);
            }, this);
    },

    /**
     * Returns list of libraries in storage for current namespace
     * @param {Object} registry object
     * @returns {*}
     * @private
     */
    _getListOfLibraries: function (registry) {
        return Object.keys(registry);
    },

    /**
     * Returns list of versions for given library. Also prints this information to console
     * @param {String} registry - object
     * @returns {*}
     * @private
     */
    _getListOfVersions: function (registry) {
        return Object.keys(registry[this._source].versions);
    },

    /**
     * Returns version info object. Also prints this information to console
     * @param {Object} registry object
     * @returns {*}
     * @private
     */
    _getVersionInfo: function (registry) {
        return registry[this._source].versions[this._ref];
    }
});
