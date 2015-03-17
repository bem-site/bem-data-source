'use strict';

var inherit = require('inherit'),
    Table = require('easy-table'),
    Base = require('./api');

module.exports = inherit(Base, {

    /**
     * Returns list of libraries in storage for current namespace
     * @param {Object} registry object
     * @returns {*}
     * @private
     */
    _getListOfLibraries: function (registry) {
        var table = new Table();
        console.info('Libraries:');
        Object.keys(registry).forEach(function (libraryName) {
            table.cell('Name', libraryName);
            table.newRow();
        });
        console.log(table.toString());
    },

    /**
     * Returns list of versions for given library. Also prints this information to console
     * @param {String} registry - object
     * @returns {*}
     * @private
     */
    _getListOfVersions: function (registry) {
        var lib = registry[this._source],
            table = new Table();

        console.info('Library: %s', lib.name);
        console.info('Versions:');

        Object.keys(lib.versions).forEach(function (versionName) {
            var version = lib.versions[versionName];
            table.cell('Library', this._source);
            table.cell('Name', versionName);
            table.cell('Sha', version.sha);
            table.cell('Date', (new Date(version.date)).toString());
            table.newRow();
        }, this);
        console.log(table.toString());
    },

    /**
     * Returns version info object. Also prints this information to console
     * @param {Object} registry object
     * @returns {*}
     * @private
     */
    _getVersionInfo: function (registry) {
        var version = registry[this._source].versions[this._ref],
            table = new Table();

        table.cell('Library', this._source);
        table.cell('Version', this._ref);
        table.cell('Sha', version.sha);
        table.cell('Date', (new Date(version.date)).toString());
        table.newRow();

        console.log(table.toString());
    }
});
