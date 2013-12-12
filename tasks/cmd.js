/* global toString: false */
'use strict';

var UTIL = require('util'),

    //bem tools modules
    BEM = require('bem'),
    Q = BEM.require('q'),
    LOGGER = BEM.require('./logger'),
    U = BEM.require('./util');

/**
 * Execute git clone command in child process
 * @param target - {Object} with fields:
 * - source - {Object} reference to source which target was created for
 * - name - {String} - formatted repository and tag or branch names for log
 * - url - {String} - git url of repository
 * - ref - {String} - tag or branch name
 * - path - {String} - target path for git clone (relative path from the root of project)
 * - type - {String} - indicate type of target (tag or branch)
 * - tasks - {Array} - array of tasks which should be executed for this target
 * @returns {defer.promise|*}
 */
exports.gitClone = function(target) {
    return runCommand(UTIL.format('git clone --progress %s %s && cd %s && git checkout %s',
        target.url, target.path, target.path, target.ref), 'git clone', target);
};

/**
 * Execute npm install command in child process
 * @param target - {Object} with fields:
 * - source - {Object} reference to source which target was created for
 * - name - {String} - formatted repository and tag or branch names for log
 * - url - {String} - git url of repository
 * - ref - {String} - tag or branch name
 * - path - {String} - target path for git clone (relative path from the root of project)
 * - type - {String} - indicate type of target (tag or branch)
 * - tasks - {Array} - array of tasks which should be executed for this target
 * @returns {defer.promise|*}
 */
exports.npmInstall = function(target) {
    return runCommand(UTIL.format('cd %s && npm install --registry=http://npm.yandex-team.ru',
        target.path), 'npm install', target);
};

/**
 * Execute bem make libs command in child process
 * @param target - {Object} with fields:
 * - source - {Object} reference to source which target was created for
 * - name - {String} - formatted repository and tag or branch names for log
 * - url - {String} - git url of repository
 * - ref - {String} - tag or branch name
 * - path - {String} - target path for git clone (relative path from the root of project)
 * - type - {String} - indicate type of target (tag or branch)
 * - tasks - {Array} - array of tasks which should be executed for this target
 * @returns {defer.promise|*}
 */
exports.bemMakeLibs = function(target) {
    return runCommand(UTIL.format('cd %s && bem make libs', target.path), 'bem make libs', target);
};

/**
 * Execute bem make sets command in child process
 * @param target - {Object} with fields:
 * - source - {Object} reference to source which target was created for
 * - name - {String} - formatted repository and tag or branch names for log
 * - url - {String} - git url of repository
 * - ref - {String} - tag or branch name
 * - path - {String} - target path for git clone (relative path from the root of project)
 * - type - {String} - indicate type of target (tag or branch)
 * - tasks - {Array} - array of tasks which should be executed for this target
 * @returns {defer.promise|*}
 */
exports.bemMakeSets = function(target) {
    return runCommand(UTIL.format('cd %s && bem make sets', target.path), 'bem make sets', target);
};

/**
 * Run command in child process
 * @param cmd - {String} command to run
 * @param name - {String} command name for log
 * @param target - {Object} target
 * @returns {defer.promise|*}
 */
var runCommand = function(cmd, name, target) {
    LOGGER.debug(cmd);

    var def = Q.defer();
    U.exec(cmd, { maxBuffer: 10000*1024 }, true).then(
        function() {
            LOGGER.debug(UTIL.format('%s for target %s completed', name, target.name));
            def.resolve(target);
        },
        function(error) {
            LOGGER.error(UTIL.format('%s for target %s failed', name, target.name));
            def.reject(error);
        });
    return def.promise;
};