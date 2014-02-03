/* global toString: false */
'use strict';

//bem tools modules
var BEM = require('bem'),
    Q = BEM.require('q'),
    LOGGER = BEM.require('./logger'),

    //application modules
    config = require('./config'),
    git = require('./libs/git'),
    util = require('./libs/util'),

    tasks = require('./tasks'),

    executeTargets = require('./tasks/targets/execute_targets'),
    updateConfig = require('./tasks/targets/update_config'),
    collectResults = require('./tasks/targets/collect_results');

var make = (function() {
    LOGGER.setLevel(config.get('v'));
    LOGGER.info('--- data source start ---');

    tasks.init.run.apply(null)
    .then(tasks.getConfig.run)
    .then(tasks.getRepositories.run)
    .then(tasks.getTags.run)
    .then(tasks.getBranches.run)
    .then(tasks.createTargets.run)
    .then(executeTargets)
    .then(updateConfig)
    .then(collectResults)
    .then(function() {
        LOGGER.info('--- data source end ---');
    });

})();
