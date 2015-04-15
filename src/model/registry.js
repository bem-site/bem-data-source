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

    save: function () {
        return storage.get(this._options.storage).writeP(constants.ROOT, JSON.stringify(this._registry));
    },

    getLibraries: function () {
        return Object.keys(this._registry);
    },

    getLibrary: function (library) {
        return this._registry[library];
    },

    getVersions: function (library) {
        return Object.keys(this._registry[library].versions);
    },

    getVersion: function (library, version) {
        return this._registry[library].versions[version];
    },

    updateOrCreateVersion: function (library, version, shaKey) {
        this._registry[library] = this.getLibrary(library) || { name: library, versions: {} };
        this._logger.debug('registry: %s', JSON.stringify(this.getLibrary(library)));
        this._registry[library].versions[version] = { sha: shaKey, date: +(new Date()) };
        return this;
    },

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
