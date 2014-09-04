'use strict';

var path = require('path'),
    util = require('util'),

    utility = require('../util'),
    config = require('../config'),
    logger = require('../logger'),
    constants = require('../constants'),
    commander = require('../commander');

module.exports = function(repo, version) {

    var p = path.join(path.join(constants.DIRECTORY.OUTPUT, repo), version);
    logger.debug('remove directory: %s', p);

        utility.removeDir(p)
        .then(function() {
            return commander.gitAdd();
        })
        .then(function() {
            return commander.gitCommit(util.format('Update data: %s', (new Date()).toString()));
        })
        .then(function() {
            return commander.gitPush(config.get('dataConfig:ref'));
        })
        .then(function() {
            logger.info(''.toUpperCase.apply('application has been finished'));
        })
        .fail(function(err) {
            logger.error(err);
            logger.error(''.toUpperCase.apply('application failed with error'));
        });
};
