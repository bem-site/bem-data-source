/* global toString: false */
'use strict';

var util = require('util'),

    rmrf = require('rimraf'),
    q = require('q'),

    libs = require('../libs'),
    logger = libs.logger(module);

/**
 * Recursively removes source directories from filesystem
 * @param target - {Object} object with fields:
 * - name - {String} - formatted repository and tag or branch names for log
 * - url - {String} - git url of repository
 * - ref - {String} - tag or branch names
 * - path - {String} - target path for git clone (relative path from the root of project)
 * @returns {defer.promise|*}
 */
module.exports = function(target) {
    var def = q.defer();

    q.nfapply(rmrf, [target.contentPath])
    .then(
        function(result) {
            logger.info('remove directory for target %s completed', target.name);
            def.resolve(result);
        },
        function(error) {
            if(error.code === 'ENOENT') {
                logger.warn('remove directory target %s failed. Directory does not exist', target.name);
                return def.resolve();
            }else {
                logger.error('remove directory for target %s failed with reason %s', target.name, error.message);
                return def.reject(error);
            }

        }
    );
    return def.promise;
};
