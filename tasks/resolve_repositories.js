//bem tools modules
const   BEM = require('bem'),
        Q = BEM.require('q'),
        LOGGER = BEM.require('./logger'),
        _ = BEM.require('underscore'),

        //application modules
        git = require('../libs/git');

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
execute = function(sources) {
    LOGGER.info('resolveRepositories start');

    var def = Q.defer();
    try {
        Q.allSettled(
                sources.map(function(item) {
                    return git.getRepository(item);
                })
            ).then(function(res) {
                //remove all rejected promises
                res = res.filter(function(item) {
                    return item.state == 'fulfilled';
                });

                //return array of sources with items extended by git urls of repositories
                res = res.map(function(item) {
                    item = item.value;
                    return _.extend({url: item.result.git_url}, item.source);
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