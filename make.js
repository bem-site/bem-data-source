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
    commands = require('./tasks/cmd'),
    makeDocs = require('./tasks/make_docs'),
    clear = require('./tasks/clear');

var make = (function() {
    LOGGER.setLevel('silly');
    LOGGER.info('--- data source start ---');
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
            LOGGER.info("--- data source end ---");
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
        return commands.gitClone(target)
            .then(function() { return commands.npmInstall(target) })
            .then(function() { return commands.bemMakeLibs(target) })
            .then(function() { return commands.bemMakeSets(target) });

    if(target.taskNpmInstall)
        return commands.npmInstall(target)
            .then(function() { return commands.bemMakeLibs(target) })
            .then(function() { return commands.bemMakeSets(target) });

    if(target.taskMakeLibs)
        return commands.bemMakeLibs(target)
            .then(function() { return commands.bemMakeSets(target)});

    if(target.taskMakeSets)
        return commands.bemMakeSets(target);
};

var runTargetDocs = function(target) {
    if(target.taskClear)
        return clear(target)
            .then(function() { return commands.gitClone(target) })
            .then(function() { return makeDocs(target) });

    if(target.taskGitClone)
        return commands.gitClone(target)
            .then(function() { return makeDocs(target) });

    if(target.taskMakeDocs)
        return makeDocs(target);
};