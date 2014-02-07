/* global toString: false */
'use strict';

var util = require('util'),

    q = require('q'),
    _ = require('lodash'),

    //application modules
    logger = require('../libs/logger')(module),
    api = require('../libs/api'),
    u = require('../libs/util');

var MSG = {
    INFO: {
        START: '-- get branches start --',
        END: '-- get branches end --'
    },
    ERR: {
        BRANCH_NOT_PRESENT: 'Branch %s does not actually presented in branches of %s repository'
    },
    DEBUG: {
        BRANCHES_TO_EXECUTE: 'repository: %s branches: %s will be executed'
    }
};

module.exports = {

    /**
     * Retrieves information about repository branches and filter them according to config
     * @param sources - {Array} of source objects
     * @returns {defer.promise|*}
     */
    run: function(sources) {
        logger.info(MSG.INFO.START);

        return q.allSettled(
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

            logger.info(MSG.INFO.END);

            return res;
        });
    }
};

/**
 * Removes branches which excluded in config remove branches which not included in config
 * @param source {Object} source object
 * @param branches - {Array} array of branches which are actually presented for current source
 * @returns {Array} of sources with attached branches to execute
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
                    logger.error(MSG.ERR.BRANCH_NOT_PRESENT, branchInclude, source.name);
                }
            });

            result = _.intersection(branches, branchesInclude);
        }

        if(_.isArray(branchesExclude)) {
            result = _.difference(result, branchesExclude);
        }
    }

    if(result.length > 0) {
        logger.debug(MSG.DEBUG.BRANCHES_TO_EXECUTE, source.name, result);
    }

    return result;
};