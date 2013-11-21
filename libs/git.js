var BEM = require('bem'),
    Q = BEM.require('q'),
    LOGGER = BEM.require('./logger'),
    API = require("github"),
    _ = require('underscore'),
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

exports.getRepository = function(user, repo, isPrivate) {
    var def = Q.defer(),
        git = isPrivate ? gitPrivate : gitPublic;

    git.repos.get({ user: user, repo: repo }, function(err, res) {
        if (err) def.reject(err);
        def.resolve(res);
    });

    return def.promise;
};

exports.getRepositoryTags = function() {

};

exports.getRepositoryBranches = function() {

};
