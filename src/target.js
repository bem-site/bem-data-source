'use strict';

var util = require('util'),
    path = require('path'),

    vowFs = require('vow-fs'),
    _ = require('lodash'),

    constants = require('./constants'),
    libs = require('./libs'),
    logger = libs.logger(module),
    collectSets = require('./tasks/collect_sets'),
    pattern = require('../config/pattern'),

    Target = function(source, ref, type) {
        return this.init(source, ref, type);
    };

Target.prototype = {

    COMMANDS: {
        REMOVE_OUTPUT: 'removeOutput',
        CREATE_OUTPUT: 'createOutput',
        GIT_CLONE: 'gitClone',
        GIT_CHECKOUT: 'gitCheckout',
        NPM_INSTALL: 'npmInstall',
        NPM_INSTALL_BEM_SETS: 'npmInstallBemSets',
        NPM_INSTALL_BEM: 'npmInstallBem',
        NPM_RUN_DEPS: 'npmRunDeps',
        COPY_BORSCHIK: 'copyBorschik',
        NPM_RUN_BUILD: 'npmRunBuild',
        COPY_SETS: 'copySets',
        COLLECT_SETS: 'collectSets'
    },

    def: {
        builder: 'bem-tools',
        command: 'npm run build',
        copy: ['*.sets'],
        docs: {
            readme: { folder: '', pattern: 'README.md' },
            changelog: { folder: 'releases', pattern: 'changelog.md' },
            migration: { folder: 'releases', pattern: 'migration.md' },
            notes: { folder: 'releases', pattern: 'release-notes.md' }
        },
        pattern: {
            data: '%s.data.json',
            jsdoc: '%s.jsdoc.json'
        },
        skip: [],
        custom: []
    },

    source: null,
    ref: null,
    type: null,
    tasks: [],

    /**
     * Initialize target for build
     * @param source - {Object} source
     * @param ref - {String} name of tag or branch
     * @param type - {String} type of reference
     * @returns {Target}
     */
    init: function(source, ref, type) {
        this.source = source;
        this.ref = ref;
        this.type = type;

        pattern[this.getSourceName()] = pattern[this.getSourceName()] || this.def;

        this
            .addTask(function(t) {
                logger.debug('remove output folder for target %s', t.getName());

                return libs.util.removeDir(t.getOutputPath()).then(function() {
                    return t;
                });
            }, this.COMMANDS.REMOVE_OUTPUT)
            .addTask(function(t) {
                logger.debug('create output folder for target %s', t.getName());

                return vowFs.makeDir(t.getOutputPath()).then(function() {
                    return t;
                });
            }, this.COMMANDS.CREATE_OUTPUT)
            .addTask(libs.cmd.gitClone, this.COMMANDS.GIT_CLONE) //git clone
            .addTask(libs.cmd.gitCheckout, this.COMMANDS.GIT_CHECKOUT) //git checkout
            .addTask(libs.cmd.npmInstall, this.COMMANDS.NPM_INSTALL) //npm install
            .addTask(libs.cmd.npmInstallBemSets, this.COMMANDS.NPM_INSTALL_BEM_SETS) //update bem-sets version
            .addTask(libs.cmd.npmInstallBem, this.COMMANDS.NPM_INSTALL_BEM) //update bem-tools version
            .addTask(libs.cmd.npmRunDeps, this.COMMANDS.NPM_RUN_DEPS) //bower or bem make libs
            .addTask(function(t) {
                logger.debug('copy borschik configuration for target %s', t.getName());

                return vowFs
                    .copy('.borschik', path.join(t.getContentPath(), '.borschik'))
                    .then(function() {
                        return t;
                    }
                );
            }, this.COMMANDS.COPY_BORSCHIK)
            .addTask(libs.cmd.npmRunBuild, this.COMMANDS.NPM_RUN_BUILD) //alias to make sets
            .addTask(libs.cmd.copySets, this.COMMANDS.COPY_SETS) //move sets to output folder
            .addTask(collectSets, this.COMMANDS.COLLECT_SETS); //collect sets

        return this;
    },

    /**
     * Returns constructed name of task from source and ref names
     * @returns {string}
     */
    getName: function() {
        return util.format('%s %s', this.source.name, this.ref);
    },

    /**
     * Returns name of source repository
     * @returns {*}
     */
    getSourceName: function() {
        return this.source.name;
    },

    getSourcePrivacy: function() {
        return this.source.isPrivate;
    },

    /**
     * Returns github url for source
     * @returns {String} - url of source
     */
    getUrl: function() {
        return this.source.url;
    },

    /**
     * Returns path to task subdirectory in content folder
     * @returns {string}
     */
    getContentPath: function() {
        return path.join(constants.DIRECTORY.CONTENT, this.getSourceName(), this.ref.replace(/\//g, '-'));
    },

    /**
     * Returns path to task subdirectory in output folder
     * @returns {string}
     */
    getOutputPath: function() {
        return path.join(constants.DIRECTORY.OUTPUT, this.getSourceName(), this.ref.replace(/\//g, '-'));
    },

    /**
     * Add task to execution stack
     * @param task - {Function} - task function for execution
     * @param alias - {String} - name of command
     * @returns {Target}
     */
    addTask: function(task, alias) {
        if(alias && this.isNeedToPerform(alias)) {
            this.tasks.push(task);
        }
        return this;
    },

    /**
     * Make chained calls for all tasks for target and call them
     * @returns {*}
     */
    execute: function() {
        var _this = this,
            initial = this.tasks.shift();
        return this.tasks.reduce(function(prev, item) {
            return prev.then(function() {
                return item.call(null, _this);
            });
        }, initial.call(null, _this));
    },

    /**
     *
     * @returns {{repo: *, ref: *, url: string}}
     */
    createSetsResultBase: function() {
        return {
            repo: this.source.name,
            ref: this.ref,
            enb: this.getBuilderName() === 'enb',
            url: this.source.url.replace('git:', 'http:').replace('.git', ''),
            custom: this.getCustom()
        };
    },

    /**
     * Returns pattern for markdown files
     * @returns {{readme: string, changelog: (*|string), migration: (*|string)}}
     */
    getMdTargets: function() {
        return _.extend(this.def.docs, pattern[this.getSourceName()].docs || {});
    },

    /**
     * Returns pattern for output files
     * @returns {Object} with fields:
     * - data {String} pattern for data file
     * - jsdoc {String} pattern for jsdoc file
     */
    getBlockTargets: function() {
        return pattern[this.getSourceName()].pattern || this.def.pattern;
    },

    /**
     * Returns name of build command
     * @returns {*|string}
     */
    getBuildCommand: function() {
        return pattern[this.getSourceName()].command || this.def.command;
    },

    /**
     * Returns pattern for folders that should be copied to output folder
     * @returns {*|string[]}
     */
    getCopyPatterns: function() {
        return pattern[this.getSourceName()].copy || this.def.copy;
    },

    /**
     * Return pattern of folders that should be viewed for docs
     * @returns {*}
     */
    getDocPatterns: function() {
        return this.getCopyPatterns()[0];
    },

    /**
     * Return name of
     * @returns {exports.builder|*|string}
     */
    getBuilderName: function() {
        return pattern[this.getSourceName()].builder || this.def.builder;
    },

    /**
     * Returns array of command names which must be skipped for current library
     * @returns {*|exports.skip|skip|MAP.skip}
     */
    getSkippedActions: function() {
        return pattern[this.getSourceName()].skip || this.def.skip;
    },

    /**
     * Returns boolean value that indicates that current step must be performed
     * @param step - {String} name of step
     * @returns {boolean}
     */
    isNeedToPerform: function(step) {
        if(this.source.docsOnly && this.getIgnoredCommandsForDocsOnlyMode().indexOf(step) > -1) {
            return false;
        }

        if(!this.getSkippedActions().length) {
            return true;
        }

        return this.getSkippedActions().indexOf(step) === -1;
    },

    /**
     * Returns array of commands that should be skipped for --docs-only mode
     * @returns {*[]}
     */
    getIgnoredCommandsForDocsOnlyMode: function() {
        return [
            this.COMMANDS.NPM_INSTALL,
            this.COMMANDS.NPM_INSTALL_BEM_SETS,
            this.COMMANDS.NPM_INSTALL_BEM,
            this.COMMANDS.NPM_RUN_DEPS,
            this.COMMANDS.COPY_BORSCHIK,
            this.COMMANDS.NPM_RUN_BUILD,
            this.COMMANDS.COPY_SETS
        ];
    },

    getCustom: function() {
        var custom = pattern[this.getSourceName()].custom || this.def.custom;
        return custom.map(function(item) {
            if(item.url) {
                item.url = item.url
                    .replace('{lib}', this.getSourceName())
                    .replace('{ref}', this.ref);
            }
            return item;
        }, this);
    }
};

module.exports = Target;
