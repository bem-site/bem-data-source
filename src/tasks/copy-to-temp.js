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

    /**
     * Runs rsync command with options
     * @param {Object} options - options for rsync command
     * @returns {*}
     */
    _sync: function (options) {
        var _this = this,
            def = vow.defer(),
            rsync = Rsync.build(options);

        rsync.set('safe-links');
        rsync.set('copy-links');
        this._logger.debug('rsync command: %s', rsync.command());
        rsync.execute(function (err, code) {
                if (err) {
                    _this._logger.error('Rsync failed wit error %s', err.message);
                    def.reject(err);
                }else {
                    def.resolve(code);
                }
            },
            function (data) {
                _this._logger.debug(data.toString());
            },
            function (data) {
                _this._logger.warn(data.toString());
            }
        );
        return def.promise();
    }
});
