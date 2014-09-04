'use strict';

var logger = require('../logger'),
    utility = require('../util');

/**
 * Remove target folder in output directory
 * @returns {defer.promise|*}
 */
module.exports = function(target) {
    logger.debug('remove output folder for target %s', target.getName());
    return utility.removeDir(target.getOutputPath()).then(function() { return target; });
};
