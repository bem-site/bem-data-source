/* global toString: false */
'use strict';

var q = require('q'),

    //application modules
    config = require('./config'),
    libs = require('./libs'),
    tasks = require('./tasks'),
    logger = libs.logger(module);

var make = (function() {
    logger.info('--- data source start ---');

    tasks.init.run.apply(null)
    .then(tasks.getConfig.run)
    .then(tasks.getRepositories.run)
    .then(tasks.getTags.run)
    .then(tasks.getBranches.run)
    .then(tasks.createTargets.run)
    .then(tasks.executeTargets.run)
    .then(tasks.updateConfig.run)
    .then(tasks.collectResults.run)
    .then(function() {
        logger.info('--- data source end ---');
    });

})();
