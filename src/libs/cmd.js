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

var CMD = {
    GIT_INIT: {
        NAME: 'git init',
        VALUE: 'git init'
    },
    GIT_REMOTE_ADD: {
        NAME: 'git remote add',
        VALUE: 'git remote add %s %s'
    },
    GIT_CHECKOUT: {
        NAME: 'git checkout',
        VALUE: 'git checkout -b %s'
    },
    GIT_CLONE: {
        NAME: 'git clone',
        VALUE: 'git clone --progress %s %s && cd %s && git checkout %s'
    },
    NPM_INSTALL: {
        NAME: 'npm install',
        VALUE: 'npm install --registry=http://npm.yandex-team.ru'
    },
    MAKE_LIBS: {
        NAME: 'bem make libs',
        VALUE: 'bem make libs -v error'
    },
    MAKE_SETS: {
        NAME: 'bem make sets',
        VALUE: 'bem make sets -v error'
    },
    GIT_MOVE_SETS: {
        NAME: 'git move sets',
        VALUE: 'cp -R %s/*.sets %s'
    },
    GIT_MOVE_MD: {
        NAME: 'git move markdowns',
        VALUE: 'cp -R %s/*.md %s'
    },
    GIT_ADD: {
        NAME: 'git add',
        VALUE: 'git add .'
    },
    GIT_COMMIT: {
        NAME: 'git commit',
        VALUE: 'git commit -a --allow-empty -m "%s"'
    },
    GIT_PUSH: {
        NAME: 'git push',
        VALUE: 'git push -f -u origin %s'
    }
};

module.exports = {

    gitInit: function(dir) {
        return runCommand(CMD.GIT_INIT.VALUE,
            { cwd: path.resolve(constants.DIRECTORY.OUTPUT) }, CMD.GIT_INIT.NAME, null);
    },

    gitRemoteAdd: function(dir, name, _path) {
        return runCommand(util.format(CMD.GIT_REMOTE_ADD.VALUE, name, _path),
            { cwd: path.resolve(constants.DIRECTORY.OUTPUT) }, CMD.GIT_REMOTE_ADD.NAME, null);
    },

    gitCheckout: function(dir, ref) {
        return runCommand(util.format(CMD.GIT_CHECKOUT.VALUE, ref),
            { cwd: path.resolve(constants.DIRECTORY.OUTPUT) }, CMD.GIT_CHECKOUT.NAME, null);
    },

    gitClone: function(target) {
        return runCommand(
            util.format(CMD.GIT_CLONE.VALUE, target.url, target.contentPath, target.contentPath, target.ref), {}, CMD.GIT_CLONE.NAME, target);
    },

    npmInstall: function(target) {
        return runCommand(CMD.NPM_INSTALL.VALUE,
            { cwd: path.resolve(target.contentPath) }, CMD.NPM_INSTALL.NAME, target);
    },

    bemMakeLibs: function(target) {
        return runCommand(CMD.MAKE_LIBS.VALUE,
            { cwd: path.resolve(target.contentPath) }, CMD.MAKE_LIBS.NAME, target);
    },

    bemMakeSets: function(target) {
        return runCommand(CMD.MAKE_SETS.VALUE,
            { cwd: path.resolve(target.contentPath) }, CMD.MAKE_SETS.NAME, target);
    },

    gitMoveSets: function(target) {
        return runCommand(util.format(CMD.GIT_MOVE_SETS.VALUE, target.contentPath, target.outputPath), {}, CMD.GIT_MOVE_SETS.NAME, null);
    },

    gitMoveMd: function(target) {
        return runCommand(util.format(CMD.GIT_MOVE_MD.VALUE, target.contentPath, target.outputPath), {}, CMD.GIT_MOVE_MD.NAME, null);
    },

    gitAdd: function() {
        return runCommand(CMD.GIT_ADD.VALUE,
            { cwd: path.resolve(constants.DIRECTORY.OUTPUT) }, CMD.GIT_ADD.NAME, null);
    },

    gitCommit: function(message) {
        return runCommand(util.format(CMD.GIT_COMMIT.VALUE, message),
            { cwd: path.resolve(constants.DIRECTORY.OUTPUT) }, CMD.GIT_COMMIT.NAME, null);
    },

    gitPush: function(ref) {
        return runCommand(util.format(CMD.GIT_PUSH.VALUE, ref),
            { cwd: path.resolve(constants.DIRECTORY.OUTPUT) }, CMD.GIT_PUSH.NAME, null);
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
