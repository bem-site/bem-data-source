'use strict';

var util = require('util'),
    vowFs = require('vow-fs'),
    logger = require('../logger');

/**
 * Create target folder in output directory
 * @returns {defer.promise|*}
 */
module.exports = function (target) {
    logger.debug(util.format('create output folder for target %s', target.getName()), module);
    return vowFs.makeDir(target.getOutputPath()).then(function () { return target; });
};
