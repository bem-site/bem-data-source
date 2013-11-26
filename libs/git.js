var API = require("github"),
    BEM = require('bem'),
    Q = BEM.require('q'),
    LOGGER = BEM.require('./logger'),
    _ = BEM.require('underscore'),

    config = require('../config/config.js');

var gitPublic = null,
    gitPrivate = null;

/**
 * initialize github API
 */
(function() {

    LOGGER.info('Initialize github API');

    var gitConfig = config.get('gitAPI'),
        commonConfig = gitConfig['common'],
        publicConfig = gitConfig['public'],
        privateConfig = gitConfig['private'];

    gitPublic = new API(_.extend(publicConfig, commonConfig));
    gitPrivate = new API(_.extend(privateConfig, commonConfig));

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
        git = source.isPrivate ? gitPrivate : gitPublic;

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
