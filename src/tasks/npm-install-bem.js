'use strict';

var path = require('path'),
    util = require('util'),
    commander = require('../commander'),
    constants = require('../constants');

/**
 * Updates bem tools version
 *
 * @param {Target} target for building
 * @returns {defer.promise|*}
 */
module.exports = function (target) {
    return commander.runCommand(util.format('npm install --registry=%s bem@~0.8', constants.NPM_REGISTRY.PUBLIC),
        { cwd: path.resolve(target.getContentPath()) }, 'npm install bem', target);
};
