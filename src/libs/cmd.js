/* global toString: false */
'use strict';

var util = require('util'),
    path = require('path'),

    _ = require('lodash'),
    vow = require('vow'),

    config = require('../config'),
    constants = require('../constants'),
    logger = require('./logger')(module),
    u = require('./util');

module.exports = {

    /**
     * Executes git clone command
     * @param target - {Object} target object
     * @returns {defer.promise|*}
     */
    gitClone: function(target) {
        return runCommand(
            util.format('git clone --progress %s %s', target.getUrl(), target.getContentPath()), {}, 'git clone', target);
    },

    /**
     * Executes git checkout command
     * @param target - {Object} target object
     * @returns {defer.promise|*}
     */
    gitCheckout: function(target) {
        return runCommand(util.format('git checkout %s', target.ref),
            { cwd: path.resolve(target.getContentPath()) }, 'git checkout', target);
    },

    /**
     * Executes npm install command
     * @param target - {Object} target object
     * @returns {defer.promise|*}
     */
    npmInstall: function(target) {
        return runCommand('npm install --registry=http://npm.yandex-team.ru',
            { cwd: path.resolve(target.getContentPath()) }, 'npm install', target);
    },

    /**
     * Executes npm run deps command
     * @param target - {Object} target object
     * @returns {defer.promise|*}
     */
    npmRunDeps: function(target) {
        return runCommand('npm run deps',
            { cwd: path.resolve(target.getContentPath()) }, 'npm run deps', target);
    },

    /**
     * Executes bem make sets command
     * @param target - {Object} target object
     * @returns {defer.promise|*}
     */
    bemMakeSets: function(target) {
        return runCommand('node_modules/bem/bin/bem make sets -v error',
            { cwd: path.resolve(target.getContentPath()) }, 'bem make sets', target);
    },

    /**
     * Executes copying sets folders
     * @param target - {Object} target object
     * @returns {defer.promise|*}
     */
    moveSets: function(target) {
        return runCommand(util.format('cp -R *.sets %s', path.resolve(target.getOutputPath())),
            { cwd: path.resolve(target.getContentPath()) }, 'git move sets', target);
    },

    /**
     * Adds all files for commit
     * @returns {defer.promise|*}
     */
    gitAdd: function() {
        return runCommand('git add .',
            { cwd: path.resolve(constants.DIRECTORY.OUTPUT) }, 'git add', null);
    },

    /**
     * Executes git commit command
     * @param message - {String} commit message
     * @returns {defer.promise|*}
     */
    gitCommit: function(message) {
        return runCommand(util.format('git commit -a --allow-empty -m "%s"', message),
            { cwd: path.resolve(constants.DIRECTORY.OUTPUT) }, 'git commit', null);
    },

    /**
     * Executes git push command
     * @param ref {Stirng} of remote branch
     * @returns {defer.promise|*}
     */
    gitPush: function(ref) {
        return runCommand(util.format('git push -u origin %s', ref),
            { cwd: path.resolve(constants.DIRECTORY.OUTPUT) }, 'git push', null);
    }
};

/**
 * Run command in child process
 * @param cmd - {String} command to run
 * @param name - {String} command name for log
 * @param target - {Object} target
 * @returns {defer.promise|*}
 */
var runCommand = function(cmd, opts, name, target) {
    var def = vow.defer(),
        baseOpts = {
            encoding: 'utf8',
            maxBuffer: 1000000*1024
        };

    if(!target) {
        target = {name: 'all'};
    }

    var n = target.getName() || target.name;

    logger.debug('execute %s for target %s', cmd, n);

    u.exec(cmd, _.extend(opts, baseOpts)).then(
        function() {
            logger.debug('%s for target %s completed', name, n);
            def.resolve(target);
        },
        function(error) {
            logger.error(error);
            logger.error('%s for target %s failed', name, n);
            logger.error('execution of command %s failed for target %s', cmd, n);
            def.reject(error);
        }
    );
    return def.promise();
};
