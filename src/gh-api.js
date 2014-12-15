'use strict';

var Api = require('github'),
    vow = require('vow'),
    _ = require('lodash'),

    logger = require('./logger'),
    config = require('./config');

/**
 * Github API module based on github library
 */
module.exports = (function () {
    logger.info('Initialize github API', module);

    var gitPublic,
        gitPrivate,
        commonConfig = {
            version: '3.0.0',
            debug: false,
            protocol: 'https',
            timeout: 50000
        },
        publicConfig = {
            host: 'api.github.com'
        },
        privateConfig = {
            host: 'github.yandex-team.ru',
            url: '/api/v3'
        },
        publicCredentials = config.get('credentials:public'),
        privateCredentials = config.get('credentials:private');

    gitPublic = new Api(_.extend(publicConfig, commonConfig));
    if (publicCredentials && publicCredentials.length) {
        gitPublic.authenticate({ type: 'oauth', token: publicCredentials });
    }else {
        logger.warn('It would be better if you were input you public credential oauth token', module);
    }

    gitPrivate = new Api(_.extend(privateConfig, commonConfig));
    if (privateCredentials && privateCredentials.length) {
        gitPrivate.authenticate({ type: 'oauth', token: privateCredentials });
    }

    return {
        /**
         * Return information about github repository
         * @param {Object} source configuration object with fields:
         * - user {String} owner of repository
         * - name {String} name of repository
         * @returns {defer.promise|*}
         */
        getRepository: function (source) {
            var def = vow.defer(),
                git = (source.isPrivate && source.isPrivate === 'true')  ? gitPrivate : gitPublic;

            git.repos.get({ user: source.user, repo: source.name }, function (err, res) {
                if (err) {
                    logger.error(err.message, module);
                    def.reject(err);
                }
                def.resolve({ source: source, result: res });
            });

            return def.promise();
        },

        /**
         * Returns information about tags of github repository
         * @param {Object} source configuration object with fields:
         * - user {String} owner of repository
         * - name {String} name of repository
         * @returns {defer.promise|*}
         */
        getRepositoryTags: function (source) {
            var def = vow.defer(),
                git = source.isPrivate ? gitPrivate : gitPublic,
                opts = { user: source.user, repo: source.name };

            opts['per_page'] = 100;

            git.repos.getTags(opts, function (err, res) {
                if (err) {
                    logger.error(err.message, module);
                    def.reject(err);
                }
                def.resolve({ source: source, result: res });
            });

            return def.promise();
        },

        /**
         * Return information about branches of github repository
         * @param {Object} source configuration object with fields:
         * - user {String} owner of repository
         * - name {String} name of repository
         * @returns {defer.promise|*}
         */
        getRepositoryBranches: function (source) {
            var def = vow.defer(),
                git = source.isPrivate ? gitPrivate : gitPublic,
                opts = { user: source.user, repo: source.name };

            opts['per_page'] = 100;

            git.repos.getBranches(opts, function (err, res) {
                if (err) {
                    logger.error(err.message, module);
                    def.reject(err);
                }
                def.resolve({ source: source, result: res });
            });

            return def.promise();
        },

        /**
         * Returns content of repository directory or file loaded by github api
         * @param {Object} source configuration object with fields:
         * - user {String} name of user or organization which this repository is belong to
         * - repo {String} name of repository
         * - ref {String} name of branch
         * - path {String} relative path from the root of repository
         * @returns {*}
         */
        getContent: function (source) {
            var def = vow.defer(),
                git = source.isPrivate ? gitPrivate : gitPublic;
            git.repos.getContent({
                user: source.user,
                repo: source.repo,
                ref:  source.ref,
                path: source.path
            }, function (err, res) {
                if (err || !res) {
                    def.reject({ res: null, repo: source });
                }else {
                    def.resolve({ res: res, repo: source });
                }
            });
            return def.promise();
        }
    };
});
