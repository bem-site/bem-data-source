var FS = require('fs'),
    CP = require('child_process'),
    UTIL = require('util'),

    //bem tools modules
    BEM = require('bem'),
    Q = BEM.require('q'),
    FS = BEM.require('q-io/fs'),
    PATH = BEM.require('./path'),
    LOGGER = BEM.require('./logger'),
    U = BEM.require('./util'),
    _ = BEM.require('underscore'),

    //application modules
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
        .then(function(sources) {
            return gitClone(sources);
        })
})();

/**
 * Retrieves sources configuration and modify it for suitable github API calling
 * @returns {defer.promise|*}
 */
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
 * @param sources - {Array} of objects with fields:
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
 * @param sources - {Array} of objects with fields:
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
                    }else if(_.isString(source.tags.include)) {
                        if(source.tags.include == 'last') {
                            tags = [_.last(tags.sort(util.sortTags))];
                        }
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

/**
 * Retrieves information about repository branches and filter them according to config
 * @param sources - {Array} of objects with fields:
 * - user {String} name of user or organization
 * - isPrivate {Boolean} indicate if repository from private github
 * - name - {String} name of repository
 * - dir - {String} target directory
 * - tags - {Array} array of tags which should be included or excluded from make process
 * - branches - {Object} object which holds arrays of branches which should be included or excluded from make process
 * - url - {String} git url of repository
 * @returns {defer.promise|*}
 */
var resolveBranches = function(sources) {
    LOGGER.info('resolveBranches start');

    var def = Q.defer();
    try {
        Q.allSettled(
            sources.map(function(item) {
                return git.getRepositoryBranches(item);
            })
        ).then(function(res) {
            //remove all rejected promises
            res = res.filter(function(item) {
                return item.state == 'fulfilled';
            });

            res = res.map(function(item) {
                item = item.value;

                //return array which contains only branch names
                var branches = item.result.map(function(branch) {
                    return branch.name;
                });

                //remove tags which excluded in config
                //remove tags which not included in config
                var source = item.source;
                if(source.branches) {
                    if(_.isArray(source.branches.exclude)) {
                        branches = _.difference(branches, source.branches.exclude);
                    }
                    if(_.isArray(source.branches.include)) {
                        branches = _.intersection(branches, source.branches.include);
                    }
                }

                LOGGER.finfo('repository: %s branches: %s', source.name, branches);

                item.source.branches = branches;
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

var gitClone = function(sources) {
    LOGGER.info('gitClone start');

    var rootPath = config.get('contentDirectory'),
        cloneTargets = [];

    sources.forEach(function(source) {
        var sourceDir = source.dir || source.name,
            existedTagsAndBranches = U.getDirs(PATH.join(rootPath, sourceDir));
        source.tags.forEach(function(tag) {
            if(_.indexOf(existedTagsAndBranches, tag) == -1) {
                LOGGER.finfo('target source: %s %s tag %s into dir %s',
                    source.name, source.url, tag, PATH.join(rootPath, sourceDir, tag));
                cloneTargets.push({
                    url: source.url,
                    ref: tag,
                    path: PATH.join(rootPath, sourceDir, tag)
                });
            }
        });
        source.branches.forEach(function(branch) {
            if(_.indexOf(existedTagsAndBranches, branch) == -1) {
                LOGGER.finfo('target source: %s %s branch %s into dir %s',
                    source.name, source.url, branch, PATH.join(rootPath, sourceDir, branch));
                cloneTargets.push({
                    url: source.url,
                    ref: branch,
                    path: PATH.join(rootPath, sourceDir, tag)
                });
            }
        });
    });

    Q.allSettled(
        cloneTargets.map(function(target) {
            var cmd = UTIL.format('git clone --progress %s %s && cd %s && git checkout %s',
                target.url, target.path, target.path, target.ref);
            LOGGER.finfo(cmd);
            return U.exec(cmd);
        })
    ).then(function(res) {
        LOGGER.finfo("Finish clone process");
    });
};