'use strict';

var inherit = require('inherit'),

    Logger = require('bem-site-logger'),
    Registry = require('../../model/registry');

module.exports = inherit({

    _logger: undefined,
    _source: undefined,
    _ref: undefined,
    _options: undefined,
    _registry: undefined,

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
        this._registry = new Registry(this._options);
    },

    /**
     * Executes target
     * @returns {*}
     */
    execute: function () {
        return this._registry.load()
            .then(function (registry) {
                // if no source and version names were given then show list of libraries in registry
                if (!this._source) {
                    return this.getListOfLibraries();
                }

                // check if given library exists in registry
                if (!registry[this._source]) {
                    this._logger.warn('Library %s was not found in registry', this._source);
                    return [];
                }

                if (!this._ref) {
                    return this.getListOfVersions();
                }

                // check if given library version exists in registry
                if (!registry[this._source].versions[this._ref]) {
                    this._logger.warn('Library %s version %s was not found in registry', this._source, this._ref);
                    return null;
                }

                return this.getVersionInfo();
            }, this);
    },

    /**
     * Returns list of libraries in storage for current namespace
     * @returns {*}
     */
    getListOfLibraries: function () {
        return this._registry.getLibraries();
    },

    /**
     * Returns list of versions for given library. Also prints this information to console
     * @returns {*}
     */
    getListOfVersions: function () {
        return this._registry.getVersions(this._source);
    },

    /**
     * Returns version info object. Also prints this information to console
     * @returns {*}
     */
    getVersionInfo: function () {
        return this._registry.getVersion(this._source, this._ref);
    }
});
