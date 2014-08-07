'use strict';

var util = require('util'),
    path = require('path'),

    _ = require('lodash'),
    vow = require('vow'),

    u = require('./util'),
    constants = require('../constants'),
    logger = require('./logger')(module);

module.exports = {

    /**
     * Adds all files for commit
     * @returns {defer.promise|*}
     */
    gitAdd: function() {
        return this.runCommand('git add .',
            { cwd: path.resolve(constants.DIRECTORY.OUTPUT) }, 'git add', null);
    },

    /**
     * Executes git commit command
     * @param message - {String} commit message
     * @returns {defer.promise|*}
     */
    gitCommit: function(message) {
        return this.runCommand(util.format('git commit -a --allow-empty -m "%s"', message),
            { cwd: path.resolve(constants.DIRECTORY.OUTPUT) }, 'git commit', null);
    },

    /**
     * Executes git push command
     * @param ref {String} of remote branch
     * @returns {defer.promise|*}
     */
    gitPush: function(ref) {
        return this.runCommand(util.format('git push -u origin %s', ref),
            { cwd: path.resolve(constants.DIRECTORY.OUTPUT) }, 'git push', null);
    },

    /**
     * Run command in child process
     * @param cmd - {String} command to run
     * @param opts - {Object} options for command execution
     * @param name - {String} command name for log
     * @param target - {Object} target
     * @returns {defer.promise|*}
     */
    runCommand: function(cmd, opts, name, target) {
        var baseOpts = {
                encoding: 'utf8',
                maxBuffer: 1000000 * 1024
            };

        if(!target) {
            target = {
                getName: function() {
                    return 'all';
                }
            };
        }

        logger.debug('execute %s for target %s', cmd, target.getName());

        return u.exec(cmd, _.extend(opts, baseOpts))
            .then(function() {
                logger.info('%s for target %s completed', name, target.getName());
                return vow.resolve(target);
            })
            .fail(function(error) {
                logger.error(error);
                logger.error('execution of command %s failed for target %s', cmd, target.getName());
                return vow.reject(error);
            });
    }
};
