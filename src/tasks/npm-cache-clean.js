'use strict';

var path = require('path'),
    commander = require('../commander');

/**
 * Cleans npm cache
 *
 * @param {Target} target for building
 * @returns {defer.promise|*}
 */
module.exports = function (target) {
    return commander.runCommand('npm cache clean',
        { cwd: path.resolve(target.getContentPath()) }, 'npm cache clean', target);
};
