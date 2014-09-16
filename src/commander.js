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
 *
 * @param {String} url of git repository
 * @param {String} folder path to target
 * @returns {defer.promise|*}
 */
exports.gitClone = function (url, folder) {
    return this.runCommand(
        util.format('git clone --progress %s %s', url, folder), {}, 'git clone', null);
};

/**
 * Switch git branch of inner repo to branch set in config
 * @param {String} branch name
 * @returns {defer.promise|*}
 */
exports.gitCheckout = function (branch) {
    return this.runCommand(util.format('git checkout %s', branch),
        { cwd: path.resolve(constants.DIRECTORY.OUTPUT) }, 'git checkout', null);
};

/**
 * Adds all files for commit
 * @returns {defer.promise|*}
 */
exports.gitAdd = function () {
    return this.runCommand('git add .',
        { cwd: path.resolve(constants.DIRECTORY.OUTPUT) }, 'git add', null);
};

/**
 * Executes git commit command
 * @param {String} message of commit
 * @returns {defer.promise|*}
 */
exports.gitCommit = function (message) {
    return this.runCommand(util.format('git commit -a --allow-empty -m "%s"', message),
        { cwd: path.resolve(constants.DIRECTORY.OUTPUT) }, 'git commit', null);
};

/**
 * Executes git push command
 * @param {String} ref - name of remote branch
 * @returns {defer.promise|*}
 */
exports.gitPush = function (ref) {
    return this.runCommand(util.format('git push -u origin %s', ref),
        { cwd: path.resolve(constants.DIRECTORY.OUTPUT) }, 'git push', null);
};

exports.moveFiles = function (source, destination) {
    return this.runCommand(
        util.format('mv %s/* %s', source, destination), {}, util.format('move folders %s', source), null);
};

/**
 * Run command in child process
 * @param {String} cmd (command) to run
 * @param {Object} opts (options) for command execution
 * @param {String} name of command for log
 * @param {Target} target
 * @returns {defer.promise|*}
 */
exports.runCommand = function (cmd, opts, name, target) {
    var baseOpts = {
        encoding: 'utf8',
        maxBuffer: 1000000 * 1024
    };

    if (!target) {
        target = {
            getName: function () {
                return 'all';
            }
        };
    }

    // logger.debug('execute %s for target %s', cmd, target.getName());
    logger.debug(util.format('execute command: %s', cmd), module);

    return utility.exec(cmd, _.extend(opts, baseOpts))
        .then(function () {
            logger.info(util.format('%s for target %s completed', name, target.getName()), module);
            return vow.resolve(target);
        })
        .fail(function (error) {
            logger.error(error, module);
            logger.error(util.format('execution of command: %s failed', cmd), module);
            return vow.reject(error);
        });
};
