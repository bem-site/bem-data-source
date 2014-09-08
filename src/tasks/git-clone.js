'use strict';

var util = require('util'),
    commander = require('../commander');

/**
 * Executes git clone command
 * @returns {defer.promise|*}
 */
module.exports = function (target) {
    return commander.runCommand(
        util.format('git clone --progress %s %s', target.getUrl(), target.getContentPath()), {}, 'git clone', target);
};
