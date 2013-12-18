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
    getConfig = require('./tasks/get_config'),
    resolveRepositories = require('./tasks/sources/resolve_repositories'),
    resolveBranches = require('./tasks/sources/resolve_branches'),
    resolveTags = require('./tasks/sources/resolve_tags'),
    createTargets = require('./tasks/sources/create_targets'),
    executeTargets = require('./tasks/targets/execute_targets'),
    updateConfig = require('./tasks/targets/update_config'),
    collectResults = require('./tasks/targets/collect_results');

var make = (function() {

    LOGGER.setLevel(config.get('v'));
    LOGGER.info('--- data source start ---');

    init.apply(null)
    .then(getConfig)
    .then(resolveRepositories)
    .then(resolveTags)
    .then(resolveBranches)
    .then(createTargets)
    .then(executeTargets)
    .then(updateConfig)
    .then(collectResults)
    .then(function() {
        LOGGER.info('--- data source end ---');
    });

})();
