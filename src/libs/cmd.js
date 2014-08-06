'use strict';

var util = require('util'),
    path = require('path'),

    _ = require('lodash'),
    vow = require('vow'),
    vowFs = require('vow-fs'),

    constants = require('../constants'),
    collectSets = require('../tasks/collect_sets'),
    libs = require('../libs'),
    logger = libs.logger(module);

module.exports = {

    /**
     * Remove target folder in output directory
     * @param target - {Object} target object
     * @returns {defer.promise|*}
     */
    removeOutput: function(target) {
        logger.debug('remove output folder for target %s', target.getName());
        return libs.util.removeDir(target.getOutputPath()).then(function() { return target; });
    },

    /**
     * Create target folder in output directory
     * @param target - {Object} target object
     * @returns {defer.promise|*}
     */
    createOutput: function(target) {
        logger.debug('create output folder for target %s', target.getName());
        return vowFs.makeDir(target.getOutputPath()).then(function() { return target; });
    },

    /**
     * Executes git clone command
     * @param target - {Object} target object
     * @returns {defer.promise|*}
     */
    gitClone: function(target) {
        return runCommand(
            util.format('git clone --progress %s %s',
                target.getUrl(), target.getContentPath()), {}, 'git clone', target);
    },

    /**
     * Executes git checkout command
     * @param target - {Target} target object
     * @returns {defer.promise|*}
     */
    gitCheckout: function(target) {
        return runCommand(util.format('git checkout %s', target.ref),
            { cwd: path.resolve(target.getContentPath()) }, 'git checkout', target);
    },

    /**
     * Cleans npm cache
     * @param target - {Target} target object
     * @returns {defer.promise|*}
     */
    npmCacheClean: function(target) {
        return runCommand('npm cache clean',
            { cwd: path.resolve(target.getContentPath()) }, 'npm cache clean', target);
    },

    /**
     * Executes npm install command
     * @param target - {Target} target object
     * @returns {defer.promise|*}
     */
    npmInstall: function(target) {
        return runCommand(util.format('npm install --registry="%s"',
                target.getSourcePrivacy() ? constants.NPM_REGISTRY.PRIVATE : constants.NPM_REGISTRY.PUBLIC),
            { cwd: path.resolve(target.getContentPath()) }, 'npm install', target);
    },

    /**
     * Updates bem sets version
     * @param target - {Target} target object
     * @returns {defer.promise|*}
     */
    npmInstallBemSets: function(target) {
        return runCommand(util.format('npm install --registry=%s bem-sets@x bem@0.x',
                target.getSourcePrivacy() ? constants.NPM_REGISTRY.PRIVATE : constants.NPM_REGISTRY.PUBLIC),
            { cwd: path.resolve(target.getContentPath()) }, 'npm install bem-sets', target);
    },

    /**
     * Updates bem tools version
     * @param target - {Target} target object
     * @returns {defer.promise|*}
     */
    npmInstallBem: function(target) {
        return runCommand(util.format('npm install --registry=%s bem@~0.8', constants.NPM_REGISTRY.PUBLIC),
            { cwd: path.resolve(target.getContentPath()) }, 'npm install bem', target);
    },

    /**
     * Executes npm run deps command
     * @param target - {Target} target object
     * @returns {defer.promise|*}
     */
    npmRunDeps: function(target) {
        return runCommand('npm run deps',
            { cwd: path.resolve(target.getContentPath()) }, 'npm run deps', target);
    },

    copyBorschik: function(target) {
        logger.debug('copy borschik configuration for target %s', target.getName());
        return vowFs
            .copy('.borschik', path.join(t.getContentPath(), '.borschik'))
            .then(function() {
                return target;
            }
        );
    },

    /**
     * Executes npm run deps command
     * @param target - {Target} target object
     * @returns {defer.promise|*}
     */
    npmRunBuild: function(target) {
        return runCommand(target.getBuildCommand(),
                { cwd: path.resolve(target.getContentPath()) }, target.getBuildCommand(), target);
    },

    /**
     * Executes copying sets folders
     * @param target - {Target} target object
     * @returns {defer.promise|*}
     */
    copySets: function(target) {
        return vow.all(target.getCopyPatterns().map(function(item) {
            return runCommand(util.format('cp -R %s %s', item, path.resolve(target.getOutputPath())),
                { cwd: path.resolve(target.getContentPath()) }, util.format('copy folders %s', item), target);
        }));
    },

    collectSets: collectSets,

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
     * @param ref {String} of remote branch
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
 * @param opts - {Object} options for command execution
 * @param name - {String} command name for log
 * @param target - {Object} target
 * @returns {defer.promise|*}
 */
var runCommand = function(cmd, opts, name, target) {
    var def = vow.defer(),
        baseOpts = {
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

    libs.util.exec(cmd, _.extend(opts, baseOpts)).then(
        function() {
            logger.debug('%s for target %s completed', name, target.getName());
            def.resolve(target);
        },
        function(error) {
            logger.error(error);
            logger.error('%s for target %s failed', name, target.getName());
            logger.error('execution of command %s failed for target %s', cmd, target.getName());
            def.reject(error);
        }
    );
    return def.promise();
};
