'use strict';

var config = require('../config'),
    logger = require('../logger'),
    commander = require('../commander');

module.exports = function(conf) {
    return function() {
        return commander.gitAdd()
            .then(function() {
                return commander.gitCommit(conf.commitMessage);
            })
            .then(function() {
                return commander.gitPush(config.get('dataConfig:ref'));
            })
            .then(function() {
                logger.info(conf.successMessage);
            })
            .fail(function(err) {
                logger.error(conf.errorMessage, err);
            });
    };
};
