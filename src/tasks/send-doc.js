'use strict';

var util = require('util'),
    path = require('path'),
    vowFs = require('vow-fs'),

    storage = require('../cocaine/api'),
    logger = require('../logger'),
    constants = require('../constants');

/**
 * Create target folder in output directory
 * @param {Target} target for building
 * @returns {defer.promise|*}
 */
module.exports = function (target) {
    var fPath = path.join(target.getOutputPath(), constants.FILE.DATA),
        lib = target.getSourceName(),
        version = target.ref,
        key = util.format('%s/%s/%s', lib, version, fPath);

    return vowFs.read(fPath, 'utf-8')
        .then(function(content) {
            return storage.write(key, content);
        })
        .then(function() {
            return storage.read(constants.ROOT);
        })
        .then(function(registry) {
            registry = registry ? JSON.parse(registry) : {};
            registry[lib] = registry[lib] || { name: lib, versions: [] };

            logger.debug(util.format('registry: %s', JSON.stringify(registry[lib])), module);

            if(registry[lib].versions.indexOf(version) < 0) {
                registry[lib].versions.push(version);
            }
            return storage.write(constants.ROOT, JSON.stringify(registry));
        })
        .then(function() {
            return target;
        });
};

