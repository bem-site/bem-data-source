'use strict';

var path = require('path'),
    util = require('util'),
    commander = require('../commander');

/**
 * Executes git checkout command
 *
 * @param {Target} target for building
 * @returns {defer.promise|*}
 */
module.exports = function (target) {
    return commander.runCommand(util.format('git checkout %s', target.ref),
        { cwd: path.resolve(target.getContentPath()) }, 'git checkout', target);
};
