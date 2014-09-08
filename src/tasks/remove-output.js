'use strict';

var util = require('util'),
    logger = require('../logger'),
    utility = require('../util');

/**
 * Remove target folder in output directory
 * @returns {defer.promise|*}
 */
module.exports = function (target) {
    logger.debug(util.format('remove output folder for target %s', target.getName()), module);
    return utility.removeDir(target.getOutputPath()).then(function () { return target; });
};
