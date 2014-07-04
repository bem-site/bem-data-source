'use strict';

var util = require('util'),
    path = require('path'),

    vowFs = require('vow-fs'),

    constants = require('./constants'),
    libs = require('./libs'),
    logger = libs.logger(module),
    collectSets = require('./tasks/collect_sets'),
    pattern = require('../config/pattern'),

    Target = function(source, ref, type) {
        return this.init(source, ref, type);
    };

Target.prototype = {

    def: {
        builder: 'bem-tools',
        command: 'npm run build',
        copy: ['*.sets'],
        readme: {
            folder: '',
            pattern: 'README.md'
        },
        changelog: {
            folder: '',
            pattern: 'changelog.md'
        },
        migration: {
            folder: '',
            pattern: 'MIGRATION.md'
        },
        pattern: {
            data: '%s.data.json',
            jsdoc: '%s.jsdoc.json'
        },
        notes: {
            folder: '',
            pattern: 'release-notes.md'
        },
        skip: []
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
            }, 'removeOutput')
            .addTask(function(t) {
                logger.debug('create output folder for target %s', t.getName());

                return vowFs.makeDir(t.getOutputPath()).then(function() {
                    return t;
                });
            }, 'createOutput')
            .addTask(libs.cmd.gitClone, 'gitClone') //git clone
            .addTask(libs.cmd.gitCheckout, 'gitCheckout') //git checkout
            .addTask(libs.cmd.npmInstall, 'npmInstall') //npm install
            .addTask(libs.cmd.npmInstallBemSets, 'npmInstallBemSets') //update bem-sets version
            .addTask(libs.cmd.npmInstallBem, 'npmInstallBem') //update bem-tools version
            .addTask(libs.cmd.npmRunDeps, 'npmRunDeps') //bower or bem make libs
            .addTask(function(t) {
                logger.debug('copy borschik configuration for target %s', t.getName());

                return vowFs
                    .copy('.borschik', path.join(t.getContentPath(), '.borschik'))
                    .then(function() {
                        return t;
                    }
                );
            }, 'copyBorschik')
            .addTask(libs.cmd.npmRunBuild, 'npmRunBuild') //alias to make sets
            .addTask(libs.cmd.copySets, 'copySets') //move sets to output folder
            .addTask(collectSets, 'collectSets'); //collect sets

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
            url: this.source.url.replace('git:', 'http:').replace('.git', '')
        };
    },

    /**
     * Returns pattern for markdown files
     * @returns {{readme: string, changelog: (*|string), migration: (*|string)}}
     */
    getMdTargets: function() {
        return {
            readme:    pattern[this.getSourceName()].readme || this.def.readme,
            changelog: pattern[this.getSourceName()].changelog || this.def.changelog,
            migration: pattern[this.getSourceName()].migration || this.def.migration,
            notes:     pattern[this.getSourceName()].notes || this.def.notes
        };
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
        if(!this.getSkippedActions().length) {
            return true;
        }

        return this.getSkippedActions().indexOf(step) === -1;
    }
};

module.exports = Target;
