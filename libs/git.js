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

exports.getRepository = function(source) {
    LOGGER.finfo('getRepository user: %s repo: %s isPrivate: %s', source.user, source.name, source.isPrivate);

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

exports.getRepositoryTags = function(source) {
    LOGGER.finfo('getRepositoryTags user: %s repo: %s isPrivate: %s url: %s', source.user, source.name, source.isPrivate, source.url);

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

exports.getRepositoryBranches = function(source) {
    LOGGER.finfo('getRepositoryBranches user: %s repo: %s isPrivate: %s', source.user, source.name, source.isPrivate);

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
