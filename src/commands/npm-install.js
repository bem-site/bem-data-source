'use strict';

var path = require('path'),
    util = require('util'),
    commander = require('../commander'),
    constants = require('../constants');

/**
 * Executes npm install command
 * @returns {defer.promise|*}
 */
module.exports = function(target) {
    return commander.runCommand(util.format('npm install --registry="%s"',
            target.getSourcePrivacy() ? constants.NPM_REGISTRY.PRIVATE : constants.NPM_REGISTRY.PUBLIC),
        { cwd: path.resolve(target.getContentPath()) }, 'npm install', target);
};
