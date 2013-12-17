/* global toString: false */
'use strict';

//bem tools modules
var BEM = require('bem'),
    Q = BEM.require('q'),
    LOGGER = BEM.require('./logger'),

    //application modules
    config = require('./config/config'),
    git = require('./libs/git'),
    util = require('./libs/util'),

    init = require('./tasks/init'),
    getSources = require('./tasks/get_sources'),
    resolveRepositories = require('./tasks/sources/resolve_repositories'),
    resolveBranches = require('./tasks/sources/resolve_branches'),
    resolveTags = require('./tasks/sources/resolve_tags'),
    createTargets = require('./tasks/sources/create_targets'),
    executeTargets = require('./tasks/targets/execute_targets'),
    finalize = require('./tasks/targets/finalize'),
    collectResults = require('./tasks/targets/collect_results');

var make = (function() {

    LOGGER.setLevel(config.get('v'));
    LOGGER.info('--- data source start ---');

    init.apply(null)
    .then(getSources)
    .then(resolveRepositories)
    .then(resolveTags)
    .then(resolveBranches)
    .then(createTargets)
    .then(executeTargets)
    .then(finalize)
    .then(collectResults)
    .then(function() {
        LOGGER.info('--- data source end ---');
    });

})();
