'use strict';

var util = require('util'),

    vow = require('vow'),
    logger = require('../logger'),
    config = require('../config'),
    utility = require('../util'),
    mailer = require('../mailer'),
    constants = require('../constants'),
    storage = require('../cocaine/api'),

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
            logger.info('Remove command was launched in dry run mode', module);
            logger.info(util.format(
                'Data for %s %s should be removed from cocaine storage', this.source, this.ref), module);
            return vow.resolve();
        }
        return storage.init(this.options)
            .then(function () {
                return this._removeRecords();
            }, this)
            .then(function () {
                return this._removeFromRegistry();
            }, this)
            .then(function() {
                return this._sendEmail();
            }, this);
    },

    /**
     * Remove all file records from cocaine storage
     * @returns {*}
     * @private
     */
    _removeRecords: function () {
        var portionSize = config.get('maxOpenFiles') || constants.MAXIMUM_OPEN_FILES;

        return storage.find([this.source, this.ref]).then(function (keys) {
            var portions = utility.separateArrayOnChunks(keys, portionSize);

            logger.debug(util.format('example records count: %s', keys.length), module);
            logger.debug(util.format('removing will be executed in %s steps', portions.length), module);

            return portions.reduce(function (prev, item, index) {
                prev = prev.then(function () {
                    logger.debug(util.format('remove files in range %s - %s',
                        index * portionSize, (index + 1) * portionSize), module);
                    return vow.all(item.map(function (_item) {
                        return storage.remove(_item);
                    }));
                });
                return prev;
            }, vow.resolve());
        });
    },

    /**
     * Remove library version from lib registry
     * @returns {*}
     * @private
     */
    _removeFromRegistry: function () {
        return storage.read(constants.ROOT).then(function (registry) {
            var message = {
                noRegistry: 'No registry record were found. ' +
                    'Please try to make publish any library. Also this operation will be skipped',
                noLibrary: 'Library %s was not found in registry. Operation will be skipped',
                noVersion: 'Library %s version %s was not found in registry. Operation will be skipped'
            };

            // check if registry exists
            if (!registry) {
                logger.warn(message.noRegistry, module);
                return vow.resolve();
            }

            registry = JSON.parse(registry);

            // check if given library exists in registry
            if (!registry[this.source]) {
                logger.warn(util.format(message.noLibrary, this.source), module);
                return vow.resolve();
            }

            // check if given library version exists in registry
            if (!registry[this.source ].versions[this.ref]) {
                logger.warn(util.format(message.noVersion, this.source, this.ref), module);
                return vow.resolve();
            }

            delete registry[this.source].versions[this.ref];
            return storage.write(constants.ROOT, JSON.stringify(registry), [constants.ROOT]);
        }, this);
    },

    /**
     * Sends email notification
     * @returns {*}
     * @private
     */
    _sendEmail: function() {
        mailer.init();

        var subject = util.format('bem-data-source: success remove library [%s] version [%s]',
            this.source, this.ref);

        return mailer.send({
            from: config.get('mailer:from'),
            to: config.get('mailer:to'),
            subject: subject,
            text: ''
        });
    }
};

module.exports = TargetRemove;
