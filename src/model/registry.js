var util = require('util'),
    inherit = require('inherit'),
    Logger = require('bem-site-logger'),
    constants = require('../constants'),
    storage = require('../storage');

module.exports = inherit({

    _options: undefined,
    _registry: undefined,
    _logger: undefined,

    __constructor: function (options) {
        this._options = options;
        this._logger = Logger.setOptions(options.logger).createLogger(module);
    },

    /**
     * Loads registry record from mds storage
     * @returns {*}
     */
    load: function () {
        return storage.get(this._options.storage).readP(constants.ROOT)
            .then(function (registry) {
                if (!registry) {
                    this._logger.warn('No registry record were found. Empty registry record will be created');
                    registry = {};
                }

                try {
                    registry = JSON.parse(registry);
                } catch (error) {
                    this._logger.warn('Invalid registry record. Empty registry record will be created');
                    registry = {};
                }
                this._registry = registry;
                return this._registry;
            }, this);
    },

    /**
     * Saves registry record to mds storage
     * @returns {*}
     */
    save: function () {
        return storage.get(this._options.storage).writeP(constants.ROOT, JSON.stringify(this._registry));
    },

    /**
     * Returns list of libraries
     * @returns {Array}
     */
    getLibraries: function () {
        return Object.keys(this._registry);
    },

    /**
     * Return library info by name of library
     * @param {String} library name
     * @returns {*}
     */
    getLibrary: function (library) {
        return this._registry[library];
    },

    /**
     * Returns list of library by it name
     * @param {String} library name
     * @returns {Array}
     */
    getVersions: function (library) {
        return Object.keys(this._registry[library].versions);
    },

    /**
     * Returns library version info
     * @param {String} library name
     * @param {String} version name
     * @returns {*}
     */
    getVersion: function (library, version) {
        return this._registry[library].versions[version];
    },

    /**
     * Creates new or updates existed library version info in registry
     * @param {String} library name
     * @param {String} version name
     * @param {String} shaKey - unique sha sum of library version doc
     * @returns {exports}
     */
    updateOrCreateVersion: function (library, version, shaKey) {
        this._registry[library] = this.getLibrary(library) || { name: library, versions: {} };
        this._logger.debug('registry: %s', JSON.stringify(this.getLibrary(library)));
        this._registry[library].versions[version] = { sha: shaKey, date: +(new Date()) };
        return this;
    },

    /**
     * Removes library version from mds registry
     * @param {String} library name
     * @param {String} version name
     * @returns {exports}
     */
    removeVersion: function (library, version) {
        var errMessage;

        // check if given library exists in registry
        if (!this.getLibrary(library)) {
            errMessage = util.format('Library %s was not found in registry', library);
            this._logger.error(errMessage);
            throw new Error(errMessage);
        }

        // check if given library version exists in registry
        if (!this.getLibrary(library).versions[version]) {
            errMessage = util.format('Library %s version %s was not found in registry', library, version);
            this._logger.error(errMessage);
            throw new Error(errMessage);
        }

        delete this._registry[library].versions[version];
        return this;
    }
}, {});
