'use strict';

var util = require('util'),
    vowFs = require('vow-fs');

/**
 * Create target folder in output directory
 * @param {Target} target for building
 * @returns {defer.promise|*}
 */
module.exports = function (target) {
    logger.debug(util.format('create temp folder for target %s', target.getName()), module);
    return vowFs.makeDir(target.getTempPath()).then(function () { return target; });
};
