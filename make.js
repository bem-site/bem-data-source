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

    tasks = require('./tasks'),
    createTargets = require('./tasks/sources/create_targets'),
    executeTargets = require('./tasks/targets/execute_targets'),
    updateConfig = require('./tasks/targets/update_config'),
    collectResults = require('./tasks/targets/collect_results');

var make = (function() {
    //var timers = require('timers');

    LOGGER.setLevel(config.get('v'));
    LOGGER.info('--- data source start ---');

    tasks.init.apply(null)
    .then(tasks.getConfig)
    .then(tasks.sources.resolveRepositories)
    .then(tasks.sources.resolveTags)
    .then(tasks.sources.resolveBranches)
    .then(createTargets)
    .then(executeTargets)
    .then(updateConfig)
    .then(collectResults)
    .then(function() {
        LOGGER.info('--- data source end ---');
    });

})();
