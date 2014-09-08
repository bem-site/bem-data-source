'use strict';

var path = require('path'),
    vowFs = require('vow-fs'),
    logger = require('../logger');

/**
 * Copy borschik file to library directory
 *
 * @param {Target} target for building
 * @returns {defer.promise|*}
 */
module.exports = function (target) {
    logger.debug('copy borschik configuration', module);
    return vowFs
        .copy('.borschik', path.join(target.getContentPath(), '.borschik'))
        .then(function () {
            return target;
        }
    );
};
