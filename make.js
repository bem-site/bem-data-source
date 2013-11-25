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
    util = require('./libs/util'),

    resolveRepositories = require('./tasks/resolve_repositories'),
    resolveBranches = require('./tasks/resolve_branches'),
    resolveTags = require('./tasks/resolve_tags');

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
            return run(sources);
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

var run = function(sources) {
    LOGGER.info('run commands start');

    var rootPath = config.get('contentDirectory'),
        targets = [],
        def = Q.defer();

    try{

        sources.forEach(function(source) {
            var sourceDir = source.dir || source.name,
                existedTagsAndBranches = U.getDirs(PATH.join(rootPath, sourceDir)),
                createTargets = function(item) {
                    var target = {
                        name: UTIL.format('%s %s', source.name, item),
                        url: source.url,
                        ref: item,
                        path: PATH.join(rootPath, sourceDir, item)
                    };

                    if(_.indexOf(existedTagsAndBranches, item) == -1) {
                        LOGGER.finfo('target source: %s %s ref %s into dir %s',
                            source.name, source.url, item, PATH.join(rootPath, sourceDir, item));
                        targets.push(target);
                    }
                };


            source.tags.forEach(createTargets);
            source.branches.forEach(createTargets);
        });

        Q.allSettled(targets.map(runTarget)).then(function() {
            LOGGER.finfo("- data source end -");
        });


    }catch(err) {
        LOGGER.error(err.message);
        def.reject(err);
    }finally {
        return def.promise;
    }
};

var runTarget = function(target) {
    return gitClone(target)
        .then(
            function() {
                LOGGER.finfo('git clone for target %s completed', target.name);
                return npmInstall(target);
            },
            function(reason) {
                LOGGER.ferror('git clone for target %s failed with reason %s', target.name, reason.message);
                return Q.reject(reason);
            }
        )
        .then(
            function() {
                LOGGER.finfo('npm install for target %s completed', target.name);
                return makeLibs(target);
            },
            function(reason) {
                LOGGER.ferror('npm install for target %s failed with reason %s', target.name, reason.message);
                return Q.reject(reason);
            }
        )
        .then(
            function() {
                LOGGER.finfo('bem make libs for target %s completed', target.name);
                return makeSets(target);
            },
            function(reason) {
                LOGGER.ferror('bem make libs for target %s failed with reason %s', target.name, reason.message);
                return Q.reject(reason);
            }
        )
        .then(
            function() {
                LOGGER.finfo('bem make sets for target %s completed', target.name);
                var def = Q.defer();
                def.resolve();
                return def.promise;
            },
            function(reason) {
                LOGGER.ferror('bem make sets for target %s failed with reason %s', target.name, reason.message);
                return Q.reject(reason);
            }
        );
}

var gitClone = function(target) {
    var cmd = UTIL.format('git clone --progress %s %s && cd %s && git checkout %s',
                    target.url, target.path, target.path, target.ref);

    LOGGER.info(cmd);
    return U.exec(cmd, null, true);
};

var npmInstall = function(target) {
    var cmd = UTIL.format('cd %s && npm install --registry=http://npm.yandex-team.ru', target.path);

    LOGGER.info(cmd);
    return U.exec(cmd, null, true);
};

var makeLibs = function(target) {
    var cmd = UTIL.format('bem make libs -r %s', target.path);

    LOGGER.info(cmd);
    return U.exec(cmd, null, true);
};

var makeSets = function(target) {
//    var cmd = UTIL.format('bem make sets -r %s', target.path);
    var cmd = UTIL.format('cd %s && bem make sets', target.path);

    LOGGER.info(cmd);
    return U.exec(cmd, { maxBuffer: 10000*1024 });
};