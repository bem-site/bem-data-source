'use strict';

var path = require('path'),
    commander = require('../commander');

/**
 * Executes npm run deps command
 *
 * @param {Target} target for building
 * @returns {defer.promise|*}
 */
module.exports = function (target) {
    return commander.runCommand('npm run deps',
        { cwd: path.resolve(target.getContentPath()) }, 'npm run deps', target);
};
