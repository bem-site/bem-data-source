var inherit = require('inherit'),
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
                    this._registry = registry;
                    return this._registry;
                }
            }, this);
    },

    save: function () {

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

    updateOrCreateVersion: function (lib, version, shaKey) {

    },

    removeVersion: function (lib, version) {

    }
}, {});
