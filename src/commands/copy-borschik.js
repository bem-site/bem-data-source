'use strict';

var path = require('path'),
    vowFs = require('vow-fs'),
    logger = require('../logger');

/**
 * Copy borschik file to library directory
 * @returns {defer.promise|*}
 */
module.exports = function(target) {
    logger.debug('copy borschik configuration');
    return vowFs
        .copy('.borschik', path.join(target.getContentPath(), '.borschik'))
        .then(function() {
            return target;
        }
    );
};
