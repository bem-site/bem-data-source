/* global toString: false */
'use strict';

var UTIL = require('util'),

    //bem tools modules
    BEM = require('bem'),
    Q = BEM.require('q'),
    LOGGER = BEM.require('./logger'),
    _ = BEM.require('underscore'),

    //application modules
    git = require('../libs/git');

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
                res = res.filter(function(item) {
                    return item.state === 'fulfilled';
                });

                res = res.map(function(item) {
                    item = item.value;

                    //return array which contains only branch names
                    var branches = item.result.map(function(branch) {
                        return branch.name;
                    }),
                    source = item.source,
                    resultBranches = [];

                    //remove tags which excluded in config
                    //remove tags which not included in config
                    //also exclude rule have greater priority
                    if(source.branches) {
                        var branchesInclude = source.branches.include,
                            branchesExclude = source.branches.exclude;

                        if(_.isArray(branchesInclude)) {
                            resultBranches = _.intersection(branches, branchesInclude);
                        }
                        if(_.isArray(branchesExclude)) {
                            resultBranches = resultBranches.filter(function(branch) {
                                return branchesExclude.indexOf(branch) === -1;
                            });
                        }
                    }

                    if(resultBranches.length > 0) {
                        LOGGER.debug(UTIL.format('repository: %s branches: %s will be executed', source.name, resultBranches));
                    }

                    item.source.branches = resultBranches;
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

module.exports = execute;