'use strict';

var util = require('util'),
    path = require('path'),

    vow = require('vow'),
    vowFs = require('vow-fs'),

    sha = require('sha1'),
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
        key = util.format('%s/%s/%s', lib, version, constants.FILE.DATA),
        shaKey;

    return vowFs.read(fPath, 'utf-8')
        .then(function (content) {
            try {
                shaKey = sha(content);
            }catch(err) {
                shaKey = sha(util.format('%s:%s:%s', lib, version, (new Date()).toString()));
            }
            return storage.write(key, content, [lib, version]);
        })
        .then(function () {
            return storage.read(constants.ROOT);
        })
        .then(function (registry) {
            registry = registry ? JSON.parse(registry) : {};
            registry[lib] = registry[lib] || { name: lib, versions: {} };

            logger.debug(util.format('registry: %s', JSON.stringify(registry[lib])), module);

            registry[lib].versions[version] = {
                sha: shaKey,
                date: +(new Date())
            };

            return storage.write(constants.ROOT, JSON.stringify(registry), [constants.ROOT]);
        })
        .then(function () {
            return vow.resolve(target);
        });
};

