'use strict';

var util = require('util'),

    vow = require('vow'),
    Table = require('easy-table'),

    logger = require('../logger'),
    constants = require('../constants'),
    storage = require('../cocaine/api'),

    TargetView  = function (source, ref, options) {
        return this.init(source, ref, options);
    };

TargetView.prototype = {
    source: undefined,
    ref: undefined,
    options: undefined,

    /**
     * Initialize target object
     * @param {String} source - name of source (library)
     * @param {String} ref - name of reference (tag, branch, pr)
     * @param {Object} options - advanced options
     * @returns {TargetRemove}
     */
    init: function (source, ref, options) {
        this.source = source;
        this.ref = ref && ref.replace(/\//g, '-');
        this.options = options;
        return this;
    },

    /**
     * Executes target
     * @returns {*}
     */
    execute: function () {
        return storage.init(this.options)
            .then(function () {
                return storage.read(constants.ROOT);
            })
            .then(function (registry) {
                if (!registry) {
                    logger.warn(this._getMessage().registryNotFound, module);
                    return vow.resolve(null);
                }

                registry = JSON.parse(registry);

                // if no source and version names were given then show list of libraries in registry
                if (!this.source) {
                    return this._getListOfLibraries(registry);
                }

                // check if given library exists in registry
                if (!registry[this.source]) {
                    logger.warn(this._getMessage().libraryNotFound, module);
                    return vow.resolve([]);
                }

                if (!this.ref) {
                    return this._getListOfVersions(registry);
                }

                // check if given library version exists in registry
                if (!registry[this.source ].versions[this.ref]) {
                    logger.warn(this._getMessage().versionNotFound, module);
                    return vow.resolve(null);
                }

                return this._getVersionInfo(registry);
            }, this);
    },

    /**
     * Returns message for given message key
     * @returns {{registryNotFound: string, libraryNotFound: *, versionNotFound: *}}
     * @private
     */
    _getMessage: function () {
        return {
            registryNotFound: 'No registry record were found. ' +
            'Please try to make publish any library. Also this operation will be skipped',
            libraryNotFound: util.format('Library %s was not found in registry', this.source),
            versionNotFound: util.format('Library %s version %s was not found in registry', this.source, this.ref)
        };
    },

    /**
     * Returns list of libraries in storage for current namespace
     * @param {Object} registry object
     * @returns {*}
     * @private
     */
    _getListOfLibraries: function (registry) {
        var table = new Table();

        if (this.options.isCli) {
            logger.info('Libraries:', module);
            Object.keys(registry).forEach(function (libraryName) {
                table.cell('Name', libraryName);
                table.newRow();
            });
            console.log(table.toString());
        }

        return vow.resolve(Object.keys(registry));
    },

    /**
     * Returns list of versions for given library. Also prints this information to console
     * @param {String} registry - object
     * @returns {*}
     * @private
     */
    _getListOfVersions: function (registry) {
        var lib = registry[this.source],
            table = new Table();

        if (this.options.isCli) {
            logger.info(util.format('Library: %s', lib.name), module);
            logger.info('Versions:', module);

            Object.keys(lib.versions).forEach(function (versionName) {
                var version = lib.versions[ versionName ];
                table.cell('Library', this.source);
                table.cell('Name', versionName);
                table.cell('Sha', version.sha);
                table.cell('Date', (new Date(version.date)).toString());
                table.newRow();
            }, this);
            console.log(table.toString());
        }

        return vow.resolve(Object.keys(lib.versions));
    },

    /**
     * Returns version info object. Also prints this information to console
     * @param {Object} registry object
     * @returns {*}
     * @private
     */
    _getVersionInfo: function (registry) {
        var version = registry[this.source ].versions[this.ref ],
            table = new Table();

        if (this.options.isCli) {
            table.cell('Library', this.source);
            table.cell('Version', this.ref);
            table.cell('Sha', version.sha);
            table.cell('Date', (new Date(version.date)).toString());
            table.newRow();

            console.log(table.toString());
        }

        return vow.resolve(version);
    }
};

module.exports = TargetView;
