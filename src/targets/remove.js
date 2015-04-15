'use strict';

var util = require('util'),

    _ = require('lodash'),
    vow = require('vow'),
    vowNode = require('vow-node'),
    inherit = require('inherit'),

    Logger = require('bem-site-logger'),
    MailSender = require('bem-site-mail-sender'),

    storage = require('../storage'),
    config = require('../config'),
    utility = require('../util'),
    constants = require('../constants'),
    Registry = require('../model/registry');

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
        this._options = options;
        this._source = source;
        this._ref = ref.replace(/\//g, '-');
        this._logger = Logger.setOptions(options.logger).createLogger(module);
    },

    /**
     * Executes target
     * @returns {*}
     */
    execute: function () {
        if (this._options.isDryMode) {
            this._logger.info('Remove command was launched in dry run mode');
            this._logger.warn('Data for %s %s won\' be removed from storage', this._source, this._ref);
            return vow.resolve();
        }

        return this._removeExampleFiles()
            .then(this._removeDocFile.bind(this))
            .then(this._modifyRegistry.bind(this))
            .then(this._sendEmail.bind(this));
    },

    /**
     * Returns files portion size for batch remove operations
     * @returns {Number}
     * @private
     */
    _getPortionSize: function () {
        return this._options['maxOpenFiles'] || config.get('maxOpenFiles') || constants.MAXIMUM_OPEN_FILES;
    },

    /**
     * Returns examples registry key in storage
     * @returns {String}
     * @private
     */
    _getExamplesKey: function () {
        return util.format('%s/%s/%s', this._source, this._ref, 'examples');
    },

    /**
     * Returns documentation file key in storage
     * @returns {String}
     * @private
     */
    _getDocsKey: function () {
        return util.format('%s/%s/%s', this._source, this._ref, constants.FILE.DATA);
    },

    _removeExampleFiles: function () {
        var ps = this._getPortionSize();

        this._logger.debug('Start to remove example records');
        return storage.get(this._options.storage).readP(this._getExamplesKey())
            .then(function (content) {
                if (!content) {
                    this._logger.warn('No examples were found for %s %s', this._source, this._ref);
                    return vow.resolve();
                }

                var _this = this,
                    keys = JSON.parse(content),
                    portions = _.chunk(keys, ps);

                this._logger.debug('example records count: %s', keys.length);
                this._logger.debug('removing will be executed in %s steps', portions.length);

                return portions.reduce(function (prev, item, index) {
                        prev = prev.then(function () {
                            _this._logger.verbose('remove files in range %s - %s', index * ps, (index + 1) * ps);
                            return vow.all(item.map(function (_item) {
                                return _this._options.isDryRun ? vow.resolve() :
                                    storage.get(_this._options.storage).removeP(_item);
                            }));
                        });
                        return prev;
                    }, vow.resolve())
                    .then(function () {
                        this._logger.info('Start to remove example registry');
                        return storage.get(this._options.storage).removeP(this._getExamplesKey());
                    }, this);
            }, this);
    },

    /**
     * Removes documentation file for given library version
     * Removes file for key {lib}/{version}/data.json from the storage
     * @returns {*}
     * @private
     */
    _removeDocFile: function () {
        this._logger.debug('Start to remove doc file');
        return storage.get(this._options.storage).removeP(this._getDocsKey());
    },

    /**
     * Remove library version from lib registry
     * @returns {*}
     * @private
     */
    _modifyRegistry: function () {
        this._logger.debug('Start to remove library from common registry');
        var registry = new Registry(this._options);
        return registry.load()
            .then(function () {
                return registry.removeVersion(this._source, this._ref);
            }, this)
            .then(function () {
                return registry.save();
            });
    },

    /**
     * Sends e-mail with information about removed library version
     * @returns {*}
     * @private
     */
    _sendEmail: function () {
        var mailer,
            subject,
            o = this._options['mailer'] || config.get('mailer');
        if (!o) {
            this._logger.warn('No e-mail options were set');
            return;
        }

        mailer = new MailSender(_.pick(o, ['host', 'port']));
        subject = util.format('bem-data-source: success remove library [%s] version [%s]', this._source, this._ref);
        return vowNode.promisify(mailer.sendHtml).call(mailer, o.from, o.to, subject, '<h2>' + subject + '</h2>');
    }
}, {});
