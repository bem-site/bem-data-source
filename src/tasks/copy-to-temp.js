'use strict';

var path = require('path'),
    vow = require('vow'),
    inherit = require('inherit'),
    Rsync = require('rsync'),

    Base = require('./base');

module.exports = inherit(Base, {

    /**
     * Executes copying built folders from content to temp
     * @returns {defer.promise|*}
     */
    run: function () {
        var rSyncConfiguration = this._target.rsyncConfiguration;
        return vow.all(rSyncConfiguration.targets.map(function (suffix) {
            var syncOptions = {
                source: path.join(process.cwd(), suffix),
                destination: path.join(this._target.getTempPath()),
                flags: 'rd'
            };

            // add include file patterns if exist
            if (rSyncConfiguration.include && rSyncConfiguration.include.length) {
                syncOptions.include = rSyncConfiguration.include;
            }

            // add exclude file patterns if exist
            if (rSyncConfiguration.exclude && rSyncConfiguration.exclude.length) {
                syncOptions.exclude = rSyncConfiguration.exclude;
            }

            return this._sync(syncOptions);
        }, this));
    },

    _onDebug: function (data) {
        this._logger.debug(data.toString());
    },

    _onWarn: function (data) {
        this._logger.warn(data.toString());
    },

    _getCBFunction: function (defer) {
        return function (err, code) {
            err ? defer.reject(err) : defer.resolve(code);
        };
    },

    /**
     * Runs rsync command with options
     * @param {Object} options - options for rsync command
     * @returns {*}
     */
    _sync: function (options) {
        var def = vow.defer(),
            rsync = Rsync.build(options);

        rsync.set('safe-links');
        rsync.set('copy-links');
        this._logger.debug('rsync command: %s', rsync.command());
        rsync.execute(this._getCBFunction(def), this._onDebug.bind(this), this._onWarn.bind(this));
        return def.promise();
    }
});
