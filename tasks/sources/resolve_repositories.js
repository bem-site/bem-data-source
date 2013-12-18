/* global toString: false */
'use strict';

var UTIL = require('util'),

    //bem tools modules
    BEM = require('bem'),
    Q = BEM.require('q'),
    LOGGER = BEM.require('./logger'),
    _ = BEM.require('underscore');

/**
 * Retrieves information about git repositories by their names
 * @param sources - {Array} of objects with fields:
 * - user {String} name of user or organization
 * - isPrivate {Boolean} indicate if repository from private github
 * - name - {String} name of repository
 * - targetDir - {String} target directory
 * - docDirs - {Array} array of string path where docs are
 * - type - {String} type of repository. Different engines should be used for different types
 * - tags - {Object} object which holds arrays of tags which should be included or excluded from make process
 * - branches - {Object} object which holds arrays of branches which should be included or excluded from make process
 * @returns {defer.promise|*}
 */
var execute = function(sources) {
    LOGGER.info('step2: - resolveRepositories start');

    sources = sources.map(function(source) {
        var gitUrl = UTIL.format('git://%s/%s/%s.git',
                source.isPrivate ? 'github.yandex-team.ru' : 'github.com', source.user, source.name);

        LOGGER.debug(UTIL.format('resolve repository with name %s and url %s', source.name, gitUrl));
        return _.extend({ url: gitUrl }, source);
    });

    LOGGER.info('step2: - resolveRepositories end');
    return sources;
};

module.exports = execute;