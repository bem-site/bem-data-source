'use strict';

var util = require('util'),

    vow = require('vow'),

    storage = require('../storage'),
    config = require('../config'),
    utility = require('../util'),
    mailer = require('../mailer'),
    constants = require('../constants'),

    TargetRemove  = function (source, ref, options) {
        return this.init(source, ref, options);
    };

TargetRemove.prototype = {
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
        this.ref = ref.replace(/\//g, '-');
        this.options = options;
        return this;
    },

    /**
     * Executes target
     * @returns {*}
     */
    execute: function () {
        if (this.options.isDryRun) {
            console.info('Remove command was launched in dry run mode', module);
            console.warn(util.format(
                'Data for %s %s won\' be removed from storage', this.source, this.ref), module);
        }

        return this._removeRecords()
            .then(function () {
                return this._removeFromRegistry();
            }, this)
            .then(function () {
                return this._sendEmail();
            }, this);
    },

    /**
     * Remove all file records from storage
     * @returns {*}
     * @private
     */
    _removeRecords: function () {
        var portionSize = this.options.maxOpenFiles || config.get('maxOpenFiles') || constants.MAXIMUM_OPEN_FILES,
            examplesRegistryKey = util.format('%s/%s/%s', this.source, this.ref, 'examples');

        console.info('Start to remove example records', module);
        return storage.get(this.options.storage).readP(examplesRegistryKey)
            .then(function (content) {
                var _this = this,
                    keys = JSON.parse(content),
                    portions = utility.separateArrayOnChunks(keys, portionSize);

                console.debug(util.format('example records count: %s', keys.length), module);
                console.debug(util.format('removing will be executed in %s steps', portions.length), module);

                return portions.reduce(function (prev, item, index) {
                    prev = prev.then(function () {
                        console.debug(util.format('remove files in range %s - %s',
                            index * portionSize, (index + 1) * portionSize), module);
                        return vow.all(item.map(function (_item) {
                            return _this.options.isDryRun ? vow.resolve() :
                                storage.get(_this.options.storage).removeP(_item);
                        }));
                    });
                    return prev;
                }, vow.resolve());
            }, this);
    },

    /**
     * Remove library version from lib registry
     * @returns {*}
     * @private
     */
    _removeFromRegistry: function () {
        return storage.get(this.options.storage).readP(constants.ROOT).then(function (registry) {
            var message = {
                noRegistry: 'No registry record were found. ' +
                    'Please try to make publish any library. Also this operation will be skipped',
                noLibrary: 'Library %s was not found in registry. Operation will be skipped',
                noVersion: 'Library %s version %s was not found in registry. Operation will be skipped'
            };

            console.info('Start to remove library from common registry', module);

            // check if registry exists
            if (!registry) {
                console.warn(message.noRegistry, module);
                return vow.resolve();
            }

            registry = JSON.parse(registry);

            // check if given library exists in registry
            if (!registry[this.source]) {
                console.warn(util.format(message.noLibrary, this.source), module);
                return vow.resolve();
            }

            // check if given library version exists in registry
            if (!registry[this.source].versions[this.ref]) {
                console.warn(util.format(message.noVersion, this.source, this.ref), module);
                return vow.resolve();
            }

            // should to do nothing if command was launched in dry mode
            if (this.options.isDryRun) {
                return vow.resolve();
            }

            delete registry[this.source].versions[this.ref];
            return storage.get(this.options.storage).writeP(constants.ROOT, JSON.stringify(registry));
        }, this);
    },

    /**
     * Sends email notification
     * @returns {*}
     * @private
     */
    _sendEmail: function () {
        var emailOptions = this.options['mailer'] || config.get('mailer'),
            isEnable = emailOptions || false;
        if (!isEnable) {
            return vow.resolve();
        }

        mailer.init(emailOptions);

        var subject = util.format('bem-data-source: success remove library [%s] version [%s]',
            this.source, this.ref);

        return mailer.send({
            from: emailOptions.from,
            to: emailOptions.to,
            subject: subject,
            text: ''
        });
    }
};

module.exports = TargetRemove;
