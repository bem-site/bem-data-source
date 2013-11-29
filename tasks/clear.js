const   UTIL = require('util'),

        WRENCH = require('wrench'),

        //bem modules
        BEM = require('bem'),
        Q = BEM.require('q'),
        LOGGER = BEM.require('./logger'),
        U = BEM.require('./util');

/**
 * Recursively removes source directories from filesystem
 * @param target - {Object} object with fields:
 * - name - {String} - formatted repository and tag or branch names for log
 * - url - {String} - git url of repository
 * - ref - {String} - tag or branch names
 * - path - {String} - target path for git clone (relative path from the root of project)
 * - taskClear - {Boolean} - indicates when operation for removing directories from previous lunches is needed
 * - taskGitClone - {Boolean} - indicates when git clone operation execution is needed
 * - taskMakeDocs - {Boolean} - indicates when make docs operation execution is needed
 * @returns {defer.promise|*}
 */
var execute = function(target) {
    var def = Q.defer();

    Q.nfapply(WRENCH.rmdirRecursive, [target.path]).then(
        function(result) {
            LOGGER.info(UTIL.format('remove directory for target %s completed', target.name));
            def.resolve(result);
        },
        function(error) {
            if(error.code == 'ENOENT') {
                LOGGER.warn(UTIL.format('remove directory target %s failed. Directory does not exist', target.name));
                return def.resolve();
            }else {
                LOGGER.error(UTIL.format('remove directory for target %s failed with reason %s', target.name, error.message));
                return def.reject(error);
            }

        });
    return def.promise;
};

module.exports = execute;
