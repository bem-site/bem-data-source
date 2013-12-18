/* global toString: false */
'use strict';

var UTIL = require('util'),

    //bem tools modules
    BEM = require('bem'),
    Q = BEM.require('q'),
    LOGGER = BEM.require('./logger'),
    _ = BEM.require('underscore'),

    //application modules
    git = require('../../libs/git'),
    util = require('../../libs/util');

/**
 * Retrieves information about repository branches and filter them according to config
 * @param sources - {Array} of objects with fields:
 * - user {String} name of user or organization
 * - isPrivate {Boolean} indicate if repository from private github
 * - name - {String} name of repository
 * - targetDir - {String} target directory
 * - docDirs - {Array} array of string path where docs are
 * - type - {String} type of repository. Different engines should be used for different types
 * - tags - {Array} array of tags which should be included or excluded from make process
 * - branches - {Object} object which holds arrays of branches which should be included or excluded from make process
 * - url - {String} git url of repository
 * @returns {defer.promise|*}
 */
var execute = function(sources) {
    LOGGER.info('step4: - resolveBranches start');
    var def = Q.defer();

    try {
        Q.allSettled(
            sources.map(function(item) {
                return git.getRepositoryBranches(item);
            })
        ).then(function(res) {
            //remove all rejected promises
            res = util.filterAndMapFulfilledPromises(res, function(item) {
                item = item.value;
                item.source.branches = filterBranches(item.source, _.pluck(item.result, 'name'));
                return item.source;
            });

            LOGGER.info('step4: - resolveBranches end');
            def.resolve(res);
        });

    } catch(err) {
        LOGGER.error(err.message);
        def.reject(err);
    }
    return def.promise;
};

/**
 * remove branches which excluded in config
 * remove branches which not included in config
 * also exclude rule have greater priority
 * @param source {Object} with fields:
 * - user {String} name of user or organization
 * - isPrivate {Boolean} indicate if repository from private github
 * - name - {String} name of repository
 * - targetDir - {String} target directory
 * - docDirs - {Array} array of string path where docs are
 * - type - {String} type of repository. Different engines should be used for different types
 * - tags - {Array} array of tags which should be included or excluded from make process
 * - branches - {Object} object which holds arrays of branches which should be included or excluded from make process
 * - url - {String} git url of repository
 * @param branches - {Array} array of branches which are actually presented for current source
 * @returns {Array}
 */
var filterBranches = function(source, branches) {
    var result = [];

    if(source.branches) {
        var branchesInclude = source.branches.include,
            branchesExclude = source.branches.exclude;

        if(_.isArray(branchesInclude)) {
            //show errors in console log if invalid branches are presented in repositories configuration
            branchesInclude.forEach(function(branchInclude) {
                if(branches.indexOf(branchInclude) === -1) {
                    LOGGER.error(
                        UTIL.format('Branch %s does not actually presented in branches of %s repository ', branchInclude, source.name));
                }
            });

            result = _.intersection(branches, branchesInclude);
        }

        if(_.isArray(branchesExclude)) {
            result = _.difference(result, branchesExclude);
        }
    }

    if(result.length > 0) {
        LOGGER.debug(UTIL.format('repository: %s branches: %s will be executed', source.name, result));
    }

    return result;
};

module.exports = execute;