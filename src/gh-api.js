'use strict';

var _ = require('lodash'),
    inherit = require('inherit'),
    Api = require('github'),
    Logger = require('bem-site-logger'),

    Base = inherit({
        _api: undefined,
        _logger: undefined,
        _options: undefined,

        __constructor: function (options) {
            this._options = options;
            this._logger = Logger.createLogger(module);
        },

        /**
         * Returns options object
         * @returns {Object}
         */
        get options() {
            return this._options;
        },

        /**
         * Loads content of file from github via github API
         * @param {Object} options for api request. Fields:
         *    - type {String} type of repository privacy ('public' or 'private')
         *    - user {String} name of user or organization which this repository is belong to
         *    - repo {String} name of repository
         *    - ref {String} name of branch
         *    - path {String} relative path from the root of repository
         * @param {Object} headers - optional header params
         * @param {Function} callback function
         * @returns {*|Object}
         */
        getContent: function (options, headers, callback) {
            var h = headers,
                o = options,
                c = _.extend({}, o, h ? { headers: h } : {});

            this._logger.verbose('Load data from: %s %s %s %s', o.user, o.repo, o.ref, o.path);
            return this._api.repos.getContent(c, callback);
        }
    }, {
        CONFIG: {
            version: '3.0.0',
            protocol: 'https',
            timeout: 60000,
            debug: false
        }
    }),

    /**
     * API for calls to public repositories
     * @type {*|exports}
     */
    Public = inherit(Base, {
        __constructor: function (options) {
            this.__base(options);
            this._api = new Api(_.extend({ host: 'api.github.com' }, this.__self.CONFIG));

            if (!this.options.token) {
                this._logger.warn('No github authorization token were set. ' +
                'Number of requests will be limited by 60 requests per hour according to API rules');
                return;
            }

            this._api['authenticate']({ type: 'oauth', token: this.options.token });
        },

        get type() {
            return 'public';
        }
    }),

    /**
     * Api for calls to private repositories
     * @type {*|exports}
     */
    Private = inherit(Base, {
        __constructor: function (options) {
            this.__base(options);
            this._api = new Api(_.extend({
                host: 'github.yandex-team.ru',
                pathPrefix: '/api/v3'
            }, this.__self.CONFIG));
        },

        get type() {
            return 'private';
        }
    });

module.exports = inherit({
    _gitPublic: undefined,
    _gitPrivate: undefined,

    /**
     * Initialize github API for public and private repositories
     * @param {Object} options object
     * @private
     */
    __constructor: function (options) {
        this._gitPublic = new Public(options);
        this._gitPrivate = new Private(options);
    },

    /**
     * Returns public or private api depending of given type of repository
     * @param {Object} options - options fo api request. Fields:
     *    - type {String} type of repository privacy ('public' or 'private')
     * @returns {*}
     */
    get: function (options) {
        return {
            'private': this._gitPrivate,
            'public': this._gitPublic
        }[options.type];
    }
});
