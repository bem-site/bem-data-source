'use strict';

var inherit = require('inherit'),
    Table = require('easy-table'),
    Base = require('./api');

module.exports = inherit(Base, {

    /**
     * Returns list of libraries in storage for current namespace
     * @returns {*}
     */
    getListOfLibraries: function () {
        var table = new Table();
        console.info('Libraries:');
        this._registry.getLibraries().forEach(function (libraryName) {
            table.cell('Name', libraryName);
            table.newRow();
        });
        console.log(table.toString());
    },

    /**
     * Returns list of versions for given library. Also prints this information to console
     * @returns {*}
     */
    getListOfVersions: function () {
        var lib = this._registry.getLibrary(this._source),
            table = new Table();

        console.info('Library: %s', lib.name);
        console.info('Versions:');

        this._registry.getVersions(this._source).forEach(function (versionName) {
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
     * @returns {*}
     */
    getVersionInfo: function () {
        var version = this._registry.getVersion(this._source, this._ref),
            table = new Table();

        table.cell('Library', this._source);
        table.cell('Version', this._ref);
        table.cell('Sha', version.sha);
        table.cell('Date', (new Date(version.date)).toString());
        table.newRow();

        console.log(table.toString());
    }
});
