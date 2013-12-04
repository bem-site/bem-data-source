/* global toString: false */
'use strict';

//bem tools modules
var BEM = require('bem'),
    Q = BEM.require('q'),
    LOGGER = BEM.require('./logger'),

    //application modules
    config = require('./config/config'),
    util = require('./libs/util'),

    getSources = require('./tasks/get_sources'),
    resolveRepositories = require('./tasks/resolve_repositories'),
    resolveBranches = require('./tasks/resolve_branches'),
    resolveTags = require('./tasks/resolve_tags'),
    createTargets = require('./tasks/create_targets'),
    finalize = require('./tasks/finalize');

var make = (function() {

    LOGGER.setLevel(config.get('v'));
    LOGGER.info('--- data source start ---');
    util.createContentDirectory()
        .then(function() { return getSources(); })
        .then(function(sources) { return resolveRepositories(sources); })
        .then(function(sources) { return resolveTags(sources); })
        .then(function(sources) { return resolveBranches(sources); })
        .then(function(sources) { return createTargets(sources); })
        .then(function(targets) { return run(targets); })
        .then(function(targets) { return finalize(targets); });
})();

var run = function(targets) {
    LOGGER.info('run commands start');
    var def = Q.defer();
    try {
        Q.allSettled(
            targets.map(
                function(target) {
                    var initial = target.tasks.shift();
                    return target.tasks.reduce(function(prev, item) {
                        return prev.then(function() { return item.call(null, target); });
                    }, initial.call(null, target));
                }
            )
        ).then(
            function(result) {
                def.resolve(result
                    .filter(function(item) {
                        return item.state === 'fulfilled';
                    })
                    .map(function(item) {
                        return item.value;
                    })
                );
            }
        );
    }catch(err) {
        LOGGER.error(err.message);
        def.reject(err);
    }finally {
        return def.promise;
    }
};