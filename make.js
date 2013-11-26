var UTIL = require('util'),

    //bem tools modules
    BEM = require('bem'),
    Q = BEM.require('q'),
    PATH = BEM.require('./path'),
    LOGGER = BEM.require('./logger'),
    U = BEM.require('./util'),
    _ = BEM.require('underscore'),

    //application modules
    util = require('./libs/util'),

    getSources = require('./tasks/get_sources'),
    resolveRepositories = require('./tasks/resolve_repositories'),
    resolveBranches = require('./tasks/resolve_branches'),
    resolveTags = require('./tasks/resolve_tags'),
    createTargets = require('./tasks/create_targets');

var make = (function() {
    LOGGER.setLevel(0);
    LOGGER.info('- data source start -');
    util.createContentDirectory()
        .then(function() { return getSources() })
        .then(function(sources) { return resolveRepositories(sources)})
        .then(function(sources) { return resolveTags(sources) })
        .then(function(sources) { return resolveBranches(sources) })
        .then(function(sources) { return createTargets(sources) })
        .then(function(targets) { return run(targets) })
})();

var run = function(targets) {
    LOGGER.info('run commands start');
    var def = Q.defer();
    try{
        Q.allSettled(targets.map(runTarget)).then(function() {
            def.resolve();
            LOGGER.info("- data source end -");
        });
    }catch(err) {
        LOGGER.error(err.message);
        def.reject(err);
    }finally {
        return def.promise;
    }
};

var runTarget = function(target) {

    if(target.taskGitClone)
        return gitClone(target)
            .then(function() { return npmInstall(target) })
            .then(function() { return makeLibs(target) })
            .then(function() { return makeSets(target) });

    if(target.taskNpmInstall)
        return npmInstall(target)
            .then(function() { return makeLibs(target) })
            .then(function() { return makeSets(target) });

    if(target.taskMakeLibs)
        return makeLibs(target)
            .then(function() { return makeSets(target)});

    if(target.taskMakeSets)
        return makeSets(target);
}

var gitClone = function(target) {
    var def = Q.defer(),
        cmd = UTIL.format('git clone --progress %s %s && cd %s && git checkout %s',
                    target.url, target.path, target.path, target.ref);

    LOGGER.info(cmd);

    U.exec(cmd, null, true).then(
        function(result) {
            LOGGER.info(UTIL.format('git clone for target %s completed', target.name));
            def.resolve(result);
        },
        function(error) {
            LOGGER.error(UTIL.format('git clone for target %s failed with reason %s', target.name, error.message));
            return def.reject(error);
        });
    return def.promise;
};

var npmInstall = function(target) {
    var def = Q.defer(),
        cmd = UTIL.format('cd %s && npm install --registry=http://npm.yandex-team.ru', target.path);

    LOGGER.info(cmd);

    U.exec(cmd, null, true).then(
        function(result) {
            LOGGER.info(UTIL.format('npm install for target %s completed', target.name));
            def.resolve(result);
        },
        function(error) {
            LOGGER.error(UTIL.format('npm install for target %s failed with reason %s', target.name, error.message));
            return def.reject(error);
        });
    return def.promise;
};

var makeLibs = function(target) {
    var def = Q.defer(),
        cmd = UTIL.format('bem make libs -r %s', target.path);

    LOGGER.info(cmd);

    U.exec(cmd, null, true).then(
        function(result) {
            LOGGER.info(UTIL.format('bem make libs for target %s completed', target.name));
            def.resolve(result);
        },
        function(error) {
            LOGGER.error(UTIL.format('bem make libs for target %s failed with reason %s', target.name, error.message));
            return def.reject(error);
        });
    return def.promise;
};

var makeSets = function(target) {
    var def = Q.defer(),
        cmd = UTIL.format('cd %s && bem make sets', target.path);

    LOGGER.info(cmd);

    U.exec(cmd, { maxBuffer: 10000*1024 }, true).then(
        function(result) {
            LOGGER.info(UTIL.format('bem make sets for target %s completed', target.name));

            U.writeFile(PATH.join(target.path, 'make_sets_completed.txt'), 'bem make sets completed')
                .then(
                    function() {
                        def.resolve(result);
                    },
                    function(error) {
                        def.reject(error);
                    });
        },
        function(error) {
            LOGGER.error(UTIL.format('bem make sets for target %s failed with reason %s', target.name, error.message));
            return def.reject(error);
        });
    return def.promise;
};