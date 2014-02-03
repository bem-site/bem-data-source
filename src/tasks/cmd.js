/* global toString: false */
'use strict';

var UTIL = require('util'),

    //bem tools modules
    BEM = require('bem'),
    Q = BEM.require('q'),
    LOGGER = BEM.require('./logger'),
    U = BEM.require('./util'),

    config = require('./../../config/config');

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
 * Initialize git repository in dir folder
 * @param dir - {String} directory which git repository should be initialized in
 * @returns {defer.promise|*}
 */
exports.gitInit = function(dir) {
    return runCommand(UTIL.format('cd %s && git init', dir), 'git init', null);
};

/**
 * Add remote url to existing git repository
 * @param dir - {String} directory which git repository
 * @param name - {String} alias for remote url
 * @param path - {String} url of remote repository
 * @returns {defer.promise|*}
 */
exports.gitRemoteAdd = function(dir, name, path) {
    return runCommand(UTIL.format('cd %s && git remote add %s %s', dir, name, path), 'git remote add', null);
};


exports.gitAddSets = function(dir) {
    return runCommand(UTIL.format('cd %s && git add *.sets', dir), 'git add sets', null);
};

exports.gitCommit = function(message) {
    return runCommand(UTIL.format('cd %s && git commit -a -m "%s"', config.get('contentDirectory'), message), 'git commit', null);
};

exports.gitPush = function() {
    return runCommand(UTIL.format('cd %s && git push -u origin master', config.get('contentDirectory')), 'git push', null);
};

/**
 * Run command in child process
 * @param cmd - {String} command to run
 * @param name - {String} command name for log
 * @param target - {Object} target
 * @returns {defer.promise|*}
 */
var runCommand = function(cmd, name, target) {
    if(!target) {
        target = {name: 'all'};
    }

    LOGGER.debug(cmd);

    var def = Q.defer();
    U.exec(cmd, { maxBuffer: 10000*1024 }, true)
    .then(
        function() {
            LOGGER.debug(UTIL.format('%s for target %s completed', name, target.name));
            def.resolve(target);
        },
        function(error) {
            LOGGER.error(error.message);
            LOGGER.error(UTIL.format('%s for target %s failed', name, target.name));
            LOGGER.error(UTIL.format('execution of command %s failed', cmd));
            def.reject(error);
        }
    );
    return def.promise;
};