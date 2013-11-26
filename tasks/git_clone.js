var UTIL = require('util'),

    //bem tools modules
    BEM = require('bem'),
    Q = BEM.require('q'),
    LOGGER = BEM.require('./logger'),
    U = BEM.require('./util');

/**
 * Execute git clone command in child process
 * @param target - {Object} with fields:
 * - name - {String} - formatted repository and tag or branch names for log
 * - url - {String} - git url of repository
 * - ref - {String} - tag or branch names
 * - path - {String} - target path for git clone (relative path from the root of project)
 * - taskGitClone - {Boolean} - indicates when git clone operation execution is needed
 * - taskNpmInstall - {Boolean} - indicates when npm install operation execution is needed
 * - taskMakeLibs - {Boolean} - indicates when make libs operation is needed
 * - taskMakeSets - {Boolean} - indicates when make sets operation is needed
 * @returns {defer.promise|*}
 */
var execute = function(target) {
    var def = Q.defer(),
        cmd = UTIL.format('git clone --progress %s %s && cd %s && git checkout %s',
            target.url, target.path, target.path, target.ref);

    LOGGER.info(cmd);

    U.exec(cmd, null, true).then(
        function(result) {
            LOGGER.info(UTIL.format('git clone for target %s completed', target.name));
            def.resolve(result);
        },
        function(error) {
            LOGGER.error(UTIL.format('git clone for target %s failed with reason %s', target.name, error.message));
            return def.reject(error);
        });
    return def.promise;
};

module.exports = execute;
