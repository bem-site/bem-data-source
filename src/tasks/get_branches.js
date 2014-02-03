/* global toString: false */
'use strict';

var util = require('util'),

    q = require('q'),
    _ = require('lodash'),

    //application modules
    logger = require('../libs/logger')(module),
    api = require('../libs/api'),
    u = require('../libs/util');


module.exports = {

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
    run: function(sources) {
        logger.info('step4: - resolveBranches start');
        var def = q.defer();

        try {
            q.allSettled(
                    sources.map(function(item) {
                        return api.getRepositoryBranches(item);
                    })
                ).then(function(res) {
                    //remove all rejected promises
                    res = u.filterAndMapFulfilledPromises(res, function(item) {
                        item = item.value;
                        item.source.branches = filterBranches(item.source, _.pluck(item.result, 'name'));
                        return item.source;
                    });

                    logger.info('step4: - resolveBranches end');
                    def.resolve(res);
                });

        } catch(err) {
            logger.error(err.message);
            def.reject(err);
        }
        return def.promise;
    }
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
                    logger.error('Branch %s does not actually presented in branches of %s repository ', branchInclude, source.name);
                }
            });

            result = _.intersection(branches, branchesInclude);
        }

        if(_.isArray(branchesExclude) && (!source.noCache || source.noCache === 'false')) {
            result = _.difference(result, branchesExclude);
        }
    }

    if(result.length > 0) {
        logger.debug('repository: %s branches: %s will be executed', source.name, result);
    }

    return result;
};