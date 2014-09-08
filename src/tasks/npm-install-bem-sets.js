'use strict';

var path = require('path'),
    util = require('util'),
    commander = require('../commander'),
    constants = require('../constants');

/**
 * Updates bem sets version
 * @returns {defer.promise|*}
 */
module.exports = function (target) {
    return commander.runCommand(util.format('npm install --registry=%s bem-sets@x bem@^0.8.0',
            target.getSourcePrivacy() ? constants.NPM_REGISTRY.PRIVATE : constants.NPM_REGISTRY.PUBLIC),
        { cwd: path.resolve(target.getContentPath()) }, 'npm install bem-sets', target);
};
