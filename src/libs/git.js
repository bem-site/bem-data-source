/* global toString: false */
'use strict';

var API = require("github"),
    BEM = require('bem'),
    Q = BEM.require('q'),
    LOGGER = BEM.require('./logger'),
    _ = BEM.require('underscore'),

    config = require('../../config/config.js');

var gitPublic = null,
    gitPrivate = null;

/**
 * initialize github API
 */
(function() {

    LOGGER.info('Initialize github API');

    var gitConfig = config.get('gitAPI'),
        commonConfig = gitConfig.common,
        publicConfig = gitConfig.public,
        privateConfig = gitConfig.private;

    gitPublic = new API(_.extend(publicConfig, commonConfig));
    gitPrivate = new API(_.extend(privateConfig, commonConfig));

    gitPublic.authenticate(config.get('credentials:public'));
    gitPrivate.authenticate(config.get('credentials:private'));
})();

/**
 * Return information about github repository
 * @param source - {Object} configuration object with fields:
 * - user {String} owner of repository
 * - name {String} name of repository
 * @returns {defer.promise|*}
 */
exports.getRepository = function(source) {
    var def = Q.defer(),
        git = (source.isPrivate && source.isPrivate === 'true')  ? gitPrivate : gitPublic;

    git.repos.get({ user: source.user, repo: source.name }, function(err, res) {
        if (err) {
            LOGGER.error(err.message);
            def.reject(err);
        }
        def.resolve({ source: source, result: res });
    });

    return def.promise;
};

/**
 * Returns information about tags of github repository
 * @param source - {Object} configuration object with fields:
 * - user {String} owner of repository
 * - name {String} name of repository
 * @returns {defer.promise|*}
 */
exports.getRepositoryTags = function(source) {
    var def = Q.defer(),
        git = source.isPrivate ? gitPrivate : gitPublic;

    git.repos.getTags({ user: source.user, repo: source.name }, function(err, res) {
        if (err) {
            LOGGER.error(err.message);
            def.reject(err);
        }
        def.resolve({ source: source, result: res });
    });

    return def.promise;
};

/**
 * Return information about branches of github repository
 * @param source - {Object} configuration object with fields:
 * - user {String} owner of repository
 * - name {String} name of repository
 * @returns {defer.promise|*}
 */
exports.getRepositoryBranches = function(source) {
    var def = Q.defer(),
        git = source.isPrivate ? gitPrivate : gitPublic;

    git.repos.getBranches({ user: source.user, repo: source.name }, function(err, res) {
        if (err) {
            LOGGER.error(err.message);
            def.reject(err);
        }
        def.resolve({ source: source, result: res });
    });

    return def.promise;
};

/**
 * Retrieve content for the given path for repository
 * @param repository - [Object] repository {user: user, repo: repo, ref: ref}
 * @param path - [String] relative path from root of repository
 * @returns {defer.promise|*|Function|promise|Q.promise}
 */
exports.getContent = function(repository, path) {
    repository.path = path || '';

    var def = Q.defer(),
        git = (repository.private && repository.private === 'true')  ? gitPrivate : gitPublic;

    git.repos.getContent(repository, function(err, res) {
        if (err) {
            def.reject(err);
        }
        def.resolve(res);
    });
    return def.promise;
};

/**
 * Creates file in the repository
 * @param conf [Object] - configuration object with following fields:
 *   - user [String] name of owner or organization
 *   - repo [String] name of repository
 *   - branch [String] branch (optional)
 *   - path [String] relative path from root of repository
 *   - message [String] commit message
 *   - content [String] base64 encoded content of file
 * @returns {defer.promise|*|Function|promise|Q.promise}
 */
exports.createFile = function(conf) {
    var def = Q.defer(),
        git = (conf.private && conf.private === 'true') ? gitPrivate : gitPublic;

    git.repos.createFile(conf, function(err, res) {
        if(err || !res) {
            def.reject(err);
        } else {
            def.resolve(res);
        }
    });
    return def.promise;
};

/**
 * Updates file in the repository
 * @param conf [Object] - configuration object with following fields:
 *   - user [String] name of owner or organization
 *   - repo [String] name of repository
 *   - branch [String] branch (optional)
 *   - path [String] relative path from root of repository
 *   - sha [String] sha sum of target file
 *   - message [String] commit message
 *   - content [String] base64 encoded content of file
 * @returns {defer.promise|*|Function|promise|Q.promise}
 */
exports.updateFile = function(conf) {
    var def = Q.defer(),
        git = (conf.private && conf.private === 'true') ? gitPrivate : gitPublic;

    git.repos.updateFile(conf, function(err, res) {
        if(err || !res) {
            def.reject(err);
        } else {
            def.resolve(res);
        }
    });
    return def.promise;
};
