'use strict';

var vowFs = require('vow-fs'),
    logger = require('../logger');

/**
 * Create target folder in output directory
 * @returns {defer.promise|*}
 */
module.exports = function(target) {
    logger.debug('create output folder for target %s', target.getName());
    return vowFs.makeDir(target.getOutputPath()).then(function() { return target; });
};
