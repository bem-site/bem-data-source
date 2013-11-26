var UTIL = require('util'),

    //bem tools modules
    BEM = require('bem'),
    Q = BEM.require('q'),
    LOGGER = BEM.require('./logger'),
    PATH = BEM.require('./path'),
    U = BEM.require('./util');

/**
 * Execute bem make sets command in child process
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
        cmd = UTIL.format('cd %s && bem make sets', target.path);

    LOGGER.info(cmd);

    U.exec(cmd, { maxBuffer: 10000*1024 }, true).then(
        function(result) {
            LOGGER.info(UTIL.format('bem make sets for target %s completed', target.name));

            U.writeFile(PATH.join(target.path, 'make_sets_completed.txt'), 'bem make sets completed')
                .then(
                function() {
                    def.resolve(result);
                },
                function(error) {
                    def.reject(error);
                });
        },
        function(error) {
            LOGGER.error(UTIL.format('bem make sets for target %s failed with reason %s', target.name, error.message));
            return def.reject(error);
        });
    return def.promise;
};

module.exports = execute;