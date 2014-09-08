'use strict';

var path = require('path'),
    util = require('util'),

    _ = require('lodash'),
    vow = require('vow'),

    logger = require('./logger'),
    constants = require('./constants'),

    utility = require('./util');

/**
 * Clone repository from url to folder
 * @param url - {String} - url of git repository
 * @param folder - {String} path to target folder
 * @returns {defer.promise|*}
 */
exports.gitClone = function(url, folder) {
    return this.runCommand(
        util.format('git clone --progress %s %s', url, folder), {}, 'git clone', null);
};

/**
 * Adds all files for commit
 * @returns {defer.promise|*}
 */
exports.gitAdd = function() {
    return this.runCommand('git add .',
        { cwd: path.resolve(constants.DIRECTORY.OUTPUT) }, 'git add', null);
};

/**
 * Executes git commit command
 * @param message - {String} commit message
 * @returns {defer.promise|*}
 */
exports.gitCommit = function(message) {
    return this.runCommand(util.format('git commit -a --allow-empty -m "%s"', message),
        { cwd: path.resolve(constants.DIRECTORY.OUTPUT) }, 'git commit', null);
};

/**
 * Executes git push command
 * @param ref {String} of remote branch
 * @returns {defer.promise|*}
 */
exports.gitPush = function(ref) {
    return this.runCommand(util.format('git push -u origin %s', ref),
        { cwd: path.resolve(constants.DIRECTORY.OUTPUT) }, 'git push', null);
};

/**
 * Run command in child process
 * @param cmd - {String} command to run
 * @param opts - {Object} options for command execution
 * @param name - {String} command name for log
 * @param target - {Object} target
 * @returns {defer.promise|*}
 */
exports.runCommand = function(cmd, opts, name, target) {
    var baseOpts = {
        encoding: 'utf8',
        maxBuffer: 1000000 * 1024
    };

    if (!target) {
        target = {
            getName: function() {
                return 'all';
            }
        };
    }

    //logger.debug('execute %s for target %s', cmd, target.getName());
    logger.debug(util.format('execute command: %s', cmd), module);

    return utility.exec(cmd, _.extend(opts, baseOpts))
        .then(function() {
            logger.info(util.format('%s for target %s completed', name, target.getName()), module);
            return vow.resolve(target);
        })
        .fail(function(error) {
            logger.error(error, module);
            logger.error(util.format('execution of command: %s failed', cmd), module);
            return vow.reject(error);
        });
};
