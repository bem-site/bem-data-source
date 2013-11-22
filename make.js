var FS = require('fs'),
    CP = require('child_process'),

    BEM = require('bem'),
    Q = BEM.require('q'),
    FS = BEM.require('q-io/fs'),
    PATH = BEM.require('./path'),
    LOGGER = BEM.require('./logger'),
    U = BEM.require('./util'),
    _ = BEM.require('underscore'),

    config = require('./config/config'),
    git = require('./libs/git'),
    util = require('./libs/util');

var make = (function() {
    LOGGER.setLevel(0);
    LOGGER.info('- data source start -');
    util.createContentDirectory()
        .then(function() {
            return getSources();
        })
        .then(function(sources) {
            return resolveRepositories(sources);
        })
        .then(function(sources) {
            return resolveTags(sources);
        })
        .then(function(sources) {
            return resolveBranches(sources);
        })
})();

var getSources = function() {
    LOGGER.info('getSources start');

    var def = Q.defer(),
        _sources = [],
        sources = config.get('sources');

    try {
        Object.getOwnPropertyNames(sources).forEach(function(key) {
            sources[key].forEach(function(source) {
                var owner = source.org || source.user,
                    repositories = source.repositories;

                (owner && repositories) && repositories.forEach(function(repository) {
                    _sources.push(_.extend(repository, { user: owner, isPrivate: key == 'private' }))
                })
            });
        });

        def.resolve(_sources);
    } catch(err) {
        LOGGER.error(err.message);
        def.reject(err);
    } finally {
        return def.promise;
    }

};

/**
 * Retrieves information about git repositories by their names
 * @param sources - {Object} object with fields:
 * - user {String} name of user or organization
 * - isPrivate {Boolean} indicate if repository from private github
 * - name - {String} name of repository
 * - dir - {String} target directory
 * - tags - {Object} object which holds arrays of tags which should be included or excluded from make process
 * - branches - {Object} object which holds arrays of branches which should be included or excluded from make process
 * @returns {defer.promise|*}
 */
var resolveRepositories = function(sources) {
    LOGGER.info('resolveRepositories start');

    var def = Q.defer();
    try {
        Q.allSettled(
            sources.map(function(item) {
                return git.getRepository(item);
            })
        ).then(function(res) {
            //remove all rejected promises
            res = res.filter(function(item) {
                return item.state == 'fulfilled';
            });

            //return array of sources with items extended by git urls of repositories
            res = res.map(function(item) {
                item = item.value;
                return _.extend({url: item.result.git_url}, item.source);
            });

            def.resolve(res);
        });

    } catch(err) {
        LOGGER.error(err.message);
        def.reject(err);
    } finally {
        return def.promise;
    }
};

/**
 * Retrieves information about repository tags and filter them according to config
 * @param sources - {Object} object with fields:
 * - user {String} name of user or organization
 * - isPrivate {Boolean} indicate if repository from private github
 * - name - {String} name of repository
 * - dir - {String} target directory
 * - tags - {Object} object which holds arrays of tags which should be included or excluded from make process
 * - branches - {Object} object which holds arrays of branches which should be included or excluded from make process
 * - url - {String} git url of repository
 * @returns {defer.promise|*}
 */
var resolveTags = function(sources) {
    LOGGER.info('resolveTags start');

    var def = Q.defer();
    try {
        Q.allSettled(
                sources.map(function(item) {
                    return git.getRepositoryTags(item);
                })
            ).then(function(res) {
                //remove all rejected promises
                res = res.filter(function(item) {
                    return item.state == 'fulfilled';
                });

                res = res.map(function(item) {
                    item = item.value;

                    //return array which contains only tag names
                    var tags = item.result.map(function(tag) {
                       return tag.name;
                    });

                    //remove tags which excluded in config
                    //remove tags which not included in config
                    var source = item.source;
                    if(source.tags) {
                        if(_.isArray(source.tags.exclude) && source.tags.exclude.length > 0) {
                            tags = _.difference(tags, source.tags.exclude);
                        }
                        if(_.isArray(source.tags.include) && source.tags.include.length > 0) {
                            tags = _.intersection(tags, source.tags.include);
                        }
                    }

                    LOGGER.finfo('repository: %s tags: %s', source.name, tags);

                    item.source.tags = tags;
                    return item.source;
                });

                def.resolve(res);
            });

    } catch(err) {
        LOGGER.error(err.message);
        def.reject(err);
    } finally {
        return def.promise;
    }
};

var resolveBranches = function(sources) {
    LOGGER.info('resolveBranches start');
};