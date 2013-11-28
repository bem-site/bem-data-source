//bem tools modules
var BEM = require('bem'),
    Q = BEM.require('q'),
    LOGGER = BEM.require('./logger'),

    //application modules
    util = require('./libs/util'),

    getSources = require('./tasks/get_sources'),
    resolveRepositories = require('./tasks/resolve_repositories'),
    resolveBranches = require('./tasks/resolve_branches'),
    resolveTags = require('./tasks/resolve_tags'),
    createTargets = require('./tasks/create_targets'),
    gitClone = require('./tasks/git_clone'),
    npmInstall = require('./tasks/npm_install'),
    makeLibs = require('./tasks/bem_make_libs'),
    makeSets = require('./tasks/bem_make_sets'),
    makeDocs = require('./tasks/make_docs'),
    clear = require('./tasks/clear');

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

    if(target.type == 'libs') {
        return runTargetLibs(target);
    } else if (target.type == 'docs') {
        return runTargetDocs(target);
    }
}

var runTargetLibs = function(target) {
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
};

var runTargetDocs = function(target) {
    if(target.taskClear)
        return clear(target)
            .then(function() { gitClone(target) })
            .then(function() { makeDocs(target) });

    if(target.taskGitClone)
        return gitClone(target)
            .then(function() { makeDocs(target) });

    if(target.taskMakeDocs)
        return makeDocs(target);
};