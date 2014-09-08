'use strict';

var path = require('path'),
    commander = require('../commander');

/**
 * Executes npm run build or any custom build command
 *
 * @param {Target} target for building
 * @returns {defer.promise|*}
 */
module.exports = function (target) {
    var command = target.getBuildCommand();
    return commander.runCommand(command, { cwd: path.resolve(target.getContentPath()) }, command, target);
};
