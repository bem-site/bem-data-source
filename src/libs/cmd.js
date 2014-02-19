/* global toString: false */
'use strict';

var util = require('util'),
    path = require('path'),

    _ = require('lodash'),
    q = require('q'),

    config = require('../config'),
    constants = require('../constants'),
    logger = require('./logger')(module),
    u = require('./util');

module.exports = {

    /**
     * Initialize new git repository in output directory
     * @returns {defer.promise|*}
     */
    gitInit: function() {
        return runCommand('git init',
            { cwd: path.resolve(constants.DIRECTORY.OUTPUT) }, 'git init', null);
    },

    /**
     * Add git remote repo url
     * @param name - {Stirng} alias for remote git repository
     * @param _path - {String} url for remote git repository
     * @returns {defer.promise|*}
     */
    gitRemoteAdd: function(name, _path) {
        return runCommand(util.format('git remote add %s %s', name, _path),
            { cwd: path.resolve(constants.DIRECTORY.OUTPUT) }, 'git remote add', null);
    },

    /**
     * Executes git clone command
     * @param target - {Object} target object
     * @returns {defer.promise|*}
     */
    gitClone: function(target) {
        return runCommand(
            util.format('git clone --progress %s %s', target.url, target.contentPath), {}, 'git clone', target);
    },

    /**
     * Executes git checkout command
     * @param target - {Object} target object
     * @returns {defer.promise|*}
     */
    gitCheckout: function(target) {
        return runCommand(util.format('git checkout %s', target.ref),
            { cwd: path.resolve(target.contentPath) }, 'git checkout', target);
    },

    /**
     * Executes npm install command
     * @param target - {Object} target object
     * @returns {defer.promise|*}
     */
    npmInstall: function(target) {
        return runCommand('npm install --registry=http://npm.yandex-team.ru',
            { cwd: path.resolve(target.contentPath) }, 'npm install', target);
    },

    /**
     * [bowerNpmInstall description]
     * @param  {Object} target target object
     * @return 
     */
    bowerNpmInstall: function(target) {
        return runCommand('bower-npm-install --non-interactive',
            { cwd: path.resolve(target.contentPath) }, 'bower npm install', target);        
    },

    /**
     * Executes bem make libs command
     * @param target - {Object} target object
     * @returns {defer.promise|*}
     */
    bemMakeLibs: function(target) {
        return runCommand('node_modules/bem/bin/bem make libs -v error',
            { cwd: path.resolve(target.contentPath) }, 'bem make libs', target);
    },

    /**
     * Executes bem make sets command
     * @param target - {Object} target object
     * @returns {defer.promise|*}
     */
    bemMakeSets: function(target) {
        return runCommand('node_modules/bem/bin/bem make sets -v error',
            { cwd: path.resolve(target.contentPath) }, 'bem make sets', target);
    },

    /**
     * Executes copying sets folders
     * @param target - {Object} target object
     * @returns {defer.promise|*}
     */
    gitMoveSets: function(target) {
        return runCommand(util.format('cp -R %s/*.sets %s', target.contentPath, target.outputPath), {}, 'git move sets', null);
    },

    /**
     * Executes copying markdown files
     * @param target - {Object} target object
     * @returns {defer.promise|*}
     */
    gitMoveMd: function(target) {
        return runCommand(util.format('cp -R %s/*.md %s', target.contentPath, target.outputPath), {}, 'git move markdowns', null);
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
        return runCommand(util.format('git push -f -u origin %s', ref),
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
    var def = q.defer(),
        baseOpts = {
            encoding: 'utf8',
            maxBuffer: 1000000*1024
        };

    if(!target) {
        target = {name: 'all'};
    }

    logger.debug(cmd);

    u
        .exec(cmd, _.extend(opts, baseOpts))
        .then(
            function() {
                logger.debug('%s for target %s completed', name, target.name);
                def.resolve(target);
            },
            function(error) {
                logger.error(error);
                logger.error('%s for target %s failed', name, target.name);
                logger.error('execution of command %s failed', cmd);
                def.reject(error);
            }
        );
    return def.promise;
};
