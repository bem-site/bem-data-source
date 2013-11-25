//bem tools modules
var BEM = require('bem'),
    Q = BEM.require('q'),
    LOGGER = BEM.require('./logger'),
    _ = BEM.require('underscore'),

    //application modules
    config = require('../config/config'),
    git = require('../libs/git'),
    util = require('../libs/util');

/**
 * Retrieves information about repository branches and filter them according to config
 * @param sources - {Array} of objects with fields:
 * - user {String} name of user or organization
 * - isPrivate {Boolean} indicate if repository from private github
 * - name - {String} name of repository
 * - dir - {String} target directory
 * - tags - {Array} array of tags which should be included or excluded from make process
 * - branches - {Object} object which holds arrays of branches which should be included or excluded from make process
 * - url - {String} git url of repository
 * @returns {defer.promise|*}
 */
var execute = function(sources) {
    LOGGER.info('resolveBranches start');

    var def = Q.defer();
    try {
        Q.allSettled(
                sources.map(function(item) {
                    return git.getRepositoryBranches(item);
                })
            ).then(function(res) {
                //remove all rejected promises
                res = res.filter(function(item) {
                    return item.state == 'fulfilled';
                });

                res = res.map(function(item) {
                    item = item.value;

                    //return array which contains only branch names
                    var branches = item.result.map(function(branch) {
                        return branch.name;
                    });

                    //remove tags which excluded in config
                    //remove tags which not included in config
                    var source = item.source;
                    if(source.branches) {
                        if(_.isArray(source.branches.exclude)) {
                            branches = _.difference(branches, source.branches.exclude);
                        }
                        if(_.isArray(source.branches.include)) {
                            branches = _.intersection(branches, source.branches.include);
                        }
                    }

                    LOGGER.finfo('repository: %s branches: %s', source.name, branches);

                    item.source.branches = branches;
                    return item.source;
                });

                def.resolve(res);
            });

    } catch(err) {
        LOGGER.error(err.message);
        def.reject(err);
    } finally {
        return def.promise;
    }
};

module.exports = execute;