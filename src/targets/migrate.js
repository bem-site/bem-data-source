'use strict';

var util = require('util'),

    vow = require('vow'),
    inherit = require('inherit'),

    storage = require('../storage'),
    config = require('../config'),
    utility = require('../util'),
    constants = require('../constants'),
    Logger = require('../logger');

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
     */
    __constructor: function (source, ref, options) {
        this._logger = new Logger(module, options['logLevel']);

        this._source = source;
        this._ref = ref.replace(/\//g, '-');
        this._options = options;
    },

    /**
     * Executes target
     * @returns {*}
     */
    execute: function () {
        var o = this._options;

        if (o.isDryRun) {
            this._logger.info('Remove command was launched in dry run mode');
            this._logger.warn('Data for %s %s won\' be migrate', this._source, this._ref);
            return vow.resolve();
        }

        return storage.get(o.storageFrom).readP(constants.ROOT)
            .then(function (registry) {
                if (!registry) {
                    throw new Error('No registry for %s were found', o.storageFrom.get.host);
                }

                registry = JSON.parse(registry);

                if (!registry[this._source]) {
                    this._logger.error(this.__self.message.noLibrary, this._source);
                    throw new Error(util.format(this.__self.message.noLibrary, this._source));
                }

                if (!registry[this._source].versions[this._ref]) {
                    this._logger.error(this.__self.message.noVersion, this._source, this._ref);
                    throw new Error(util.format(this.__self.message.noVersion, this._source, this._ref));
                }

                return vow.resolve()
                    .then(this._migrateExampleFiles.bind(this))
                    .then(this._migrateExamplesRegistry.bind(this))
                    .then(this._migrateDocFile.bind(this))
                    .then(this._updateRegistry.bind(this));
            }, this);
    },

    /**
     * Migrate single file
     * @param {String} filePath - relative path of file
     * @returns {*}
     * @private
     */
    _migrateFile: function (filePath) {
        var key = util.format('%s/%s/%s', this._source, this._ref, filePath),
            storageFrom = storage.get(this._options.storageFrom),
            storageTo = storage.get(this._options.storageTo);

        return storageFrom.readP(key)
            .then(function (content) {
                if (!content) {
                    this._logger.warn('content of file %s is empty', filePath);
                    return vow.resolve();
                }
                return storageTo.writeP(key, content);
            }, this)
            .fail(function (error) {
                this._logger.error('Error occur while sending file %s', filePath);
                this._logger.error(error.message);
                throw error;
            }, this);
    },

    /**
     * Migrate each of example files
     * @returns {*}
     * @private
     */
    _migrateExampleFiles: function () {
        var openFilesLimit = this._options['maxOpenFiles'] ||
                config.get('maxOpenFiles') || constants.MAXIMUM_OPEN_FILES,
            examplesKey = util.format('%s/%s/examples', this._source, this._ref);
        return storage.get(this._options.storageFrom).readP(examplesKey)
            .then(function (examples) {
                if (!examples || !examples.length) {
                    this._logger.warn('No examples were found for %s %s. This step will be skipped',
                        this._source, this._ref);
                    return;
                }

                var portions = utility.separateArrayOnChunks(examples, openFilesLimit);

                this._logger.debug('example files count: %s', examples.length);
                this._logger.debug('processing will be executed in %s steps', portions.length);

                var _this = this;
                return portions.reduce(function (prev, item, index) {
                    prev = prev.then(function () {
                        this._logger.verbose('migrate files in range %s - %s',
                            index * openFilesLimit, (index + 1) * openFilesLimit);

                        var promises = item.map(function (_item) {
                            return this._migrateFile(_item);
                        }, this);

                        return vow.all(promises);
                    }, _this);
                    return prev;
                }, vow.resolve());
            }, this);
    },

    /**
     * Migrate examples registry record
     * Array with paths of all example filenames
     * @returns {*}
     * @private
     */
    _migrateExamplesRegistry: function () {
        return this._migrateFile('examples');
    },

    /**
     * Migrate doc file (data.json)
     * @returns {*}
     * @private
     */
    _migrateDocFile: function () {
        return this._migrateFile(constants.FILE.DATA);
    },

    /**
     * Modify registry of destination storage
     * @returns {*}
     * @private
     */
    _updateRegistry: function () {
        var o = this._options,
            storageFrom = storage.get(o.storageFrom),
            storageTo = storage.get(o.storageTo);

        return vow.all([
                storageFrom.readP(constants.ROOT),
                storageTo.readP(constants.ROOT)
            ])
            .spread(function (registryFrom, registryTo) {
                registryTo = registryTo ? JSON.parse(registryTo) : {};
                registryTo[this._source] = registryTo[this._source] || { name: this._source, versions: {} };

                this._logger.debug(util.format('registry: %s', JSON.stringify(registryTo[this._source])), module);

                registryTo[this._source].versions[this._ref] = registryFrom[this._source].versions[this._ref];
                return storage.get(o.storageTo).writeP(constants.ROOT, JSON.stringify(registryTo));
            }, this);
    }
}, {
    message: {
        noLibrary: 'Library %s was not found in registry. Operation will be skipped',
        noVersion: 'Library %s version %s was not found in registry. Operation will be skipped'
    }
});
