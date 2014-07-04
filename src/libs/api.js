'use strict';

var Api = require('github'),
    vow = require('vow'),
    _ = require('lodash'),

    logger = require('./logger')(module),
    config = require('../config.js'),

    gitPublic = null,
    gitPrivate = null;

module.exports = {

    /**
     * initialize github API
     */
    init: function() {
        logger.info('Initialize github API');

        var commonConfig = {
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
            };

        gitPublic = new Api(_.extend(publicConfig, commonConfig));
        gitPrivate = new Api(_.extend(privateConfig, commonConfig));

        gitPublic.authenticate(config.get('credentials:public'));
        gitPrivate.authenticate(config.get('credentials:private'));
    },

    /**
     * Return information about github repository
     * @param source - {Object} configuration object with fields:
     * - user {String} owner of repository
     * - name {String} name of repository
     * @returns {defer.promise|*}
     */
    getRepository: function(source) {
        var def = vow.defer(),
            git = (source.isPrivate && source.isPrivate === 'true')  ? gitPrivate : gitPublic;

        git.repos.get({ user: source.user, repo: source.name }, function(err, res) {
            if (err) {
                logger.error(err.message);
                def.reject(err);
            }
            def.resolve({ source: source, result: res });
        });

        return def.promise();
    },

    /**
     * Returns information about tags of github repository
     * @param source - {Object} configuration object with fields:
     * - user {String} owner of repository
     * - name {String} name of repository
     * @returns {defer.promise|*}
     */
    getRepositoryTags: function(source) {
        var def = vow.defer(),
            git = source.isPrivate ? gitPrivate : gitPublic;

        git.repos.getTags({ user: source.user, repo: source.name, per_page: 100 }, function(err, res) {
            if (err) {
                logger.error(err.message);
                def.reject(err);
            }
            def.resolve({ source: source, result: res });
        });

        return def.promise();
    },

    /**
     * Return information about branches of github repository
     * @param source - {Object} configuration object with fields:
     * - user {String} owner of repository
     * - name {String} name of repository
     * @returns {defer.promise|*}
     */
    getRepositoryBranches: function(source) {
        var def = vow.defer(),
            git = source.isPrivate ? gitPrivate : gitPublic;

        git.repos.getBranches({ user: source.user, repo: source.name, per_page: 100 }, function(err, res) {
            if (err) {
                logger.error(err.message);
                def.reject(err);
            }
            def.resolve({ source: source, result: res });
        });

        return def.promise();
    },

    /**
     * Returns content of repository directory or file loaded by github api
     * @param repository - {Object} with fields:
     * - user {String} name of user or organization which this repository is belong to
     * - repo {String} name of repository
     * - ref {String} name of branch
     * - path {String} relative path from the root of repository
     * @returns {*}
     */
    getContent: function(source) {
        var def = vow.defer(),
            git = source.isPrivate ? gitPrivate : gitPublic;
        git.repos.getContent({
            user: source.user,
            repo: source.repo,
            ref:  source.ref,
            path: source.path
        }, function(err, res) {
            if (err || !res) {
                def.reject({res: null, repo: source});
            }else {
                def.resolve({res: res, repo: source});
            }
        });
        return def.promise();
    }
};
