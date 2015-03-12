'use strict';

var util = require('util'),
    utility = require('../util');

/**
 * Remove target folder in output directory
 * @param {Target} target for building
 * @returns {defer.promise|*}
 */
module.exports = function (target) {
    logger.debug(util.format('remove temp folder for target %s', target.getName()), module);
    return utility.removeDir(target.getTempPath()).then(function () { return target; });
};
