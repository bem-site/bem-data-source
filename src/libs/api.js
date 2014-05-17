/* global toString: false */
'use strict';

var api = require("github"),
    vow = require('vow'),
    _ = require('lodash'),

    logger = require('./logger')(module),
    config = require('../config.js');

var gitPublic = null,
    gitPrivate = null;

module.exports = {

    /**
     * initialize github API
     */
    init: function() {
        logger.info('Initialize github API');

        var gitConfig = config.get('gitAPI'),
            commonConfig = gitConfig.common,
            publicConfig = gitConfig.public,
            privateConfig = gitConfig.private;

        gitPublic = new api(_.extend(publicConfig, commonConfig));
        gitPrivate = new api(_.extend(privateConfig, commonConfig));

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
    }
};
