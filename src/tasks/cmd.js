/* global toString: false */
'use strict';

var util = require('util'),

    q = require('q'),

    config = require('../config'),
    constants = require('../constants'),
    logger = require('../libs/logger')(module),
    u = require('../libs/util');

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
    return runCommand(util.format('git clone --progress %s %s && cd %s && git checkout %s',
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
    return runCommand(util.format('cd %s && npm install --registry=http://npm.yandex-team.ru',
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
    return runCommand(util.format('cd %s && bem make libs', target.path), 'bem make libs', target);
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
    return runCommand(util.format('cd %s && bem make sets', target.path), 'bem make sets', target);
};

/**
 * Initialize git repository in dir folder
 * @param dir - {String} directory which git repository should be initialized in
 * @returns {defer.promise|*}
 */
exports.gitInit = function(dir) {
    return runCommand(util.format('cd %s && git init', dir), 'git init', null);
};

/**
 * Add remote url to existing git repository
 * @param dir - {String} directory which git repository
 * @param name - {String} alias for remote url
 * @param path - {String} url of remote repository
 * @returns {defer.promise|*}
 */
exports.gitRemoteAdd = function(dir, name, path) {
    return runCommand(util.format('cd %s && git remote add %s %s', dir, name, path), 'git remote add', null);
};


exports.gitAddSets = function(dir) {
    return runCommand(util.format('cd %s && git add *.sets', dir), 'git add sets', null);
};

exports.gitCommit = function(message) {
    return runCommand(util.format('cd %s && git commit -a -m "%s"', constants.DIRECTORY.CONTENT, message), 'git commit', null);
};

exports.gitPush = function() {
    return runCommand(util.format('cd %s && git push -u origin master', constants.DIRECTORY.CONTENT), 'git push', null);
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

    logger.debug(cmd);

    var def = q.defer();
    U.exec(cmd, { maxBuffer: 10000*1024 }, true)
    .then(
        function() {
            logger.debug(util.format('%s for target %s completed', name, target.name));
            def.resolve(target);
        },
        function(error) {
            logger.error(error.message);
            logger.error(util.format('%s for target %s failed', name, target.name));
            logger.error(util.format('execution of command %s failed', cmd));
            def.reject(error);
        }
    );
    return def.promise;
};