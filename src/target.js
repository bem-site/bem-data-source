'use strict';

var util = require('util'),
    path = require('path'),

    vow = require('vow'),
    vowFs = require('vow-fs'),

    constants = require('./constants'),
    libs = require('./libs'),
    collectSets = require('./tasks/collect_sets'),
    pattern = require('../config/pattern'),

    Target = function(source, ref, type) {
        return this.init(source, ref, type);
    };

Target.prototype = {

    BLOCK_DEFAULT: {
        data: '%s.data.json',
        jsdoc: '%s.jsdoc.json'
    },

    MD: {
        README: {
            folder: '',
            patter: 'README.md'
        },
        CHANGELOG: {
            folder: '',
            pattern: 'changelog.md'
        },
        MIGRATION: {
            folder: '',
            pattern: 'MIGRATION.md'
        }
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

        this
            .addTask(function(t) {
                return vow.allResolved([
                    libs.util.removeDir(t.getContentPath()),
                    libs.util.removeDir(t.getOutputPath())
                ]).then(function() {
                    return t;
                });
            })
            .addTask(function(t) {
                return vowFs.makeDir(t.getOutputPath()).then(function() {
                    return t;
                });
            })
            .addTask(libs.cmd.gitClone) //git clone
            .addTask(libs.cmd.gitCheckout) //git checkout
            .addTask(libs.cmd.npmInstall) //npm install
            .addTask(libs.cmd.npmInstallBem) //update bem-tools version
            .addTask(libs.cmd.npmRunDeps) //bower or bem make libs
            .addTask(function(t) {
                return vowFs
                    .copy('.borschik', path.join(t.getContentPath(), '.borschik'))
                    .then(function() {
                        return t;
                    }
                );
            })
            .addTask(libs.cmd.npmRunBuild) //alias to make sets
            //.addTask(libs.cmd.bemMakeSets) //bem make sets
            .addTask(libs.cmd.moveSets) //move sets to output folder
            .addTask(collectSets); //collect sets

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
     * @returns {Target}
     */
    addTask: function(task) {
        this.tasks.push(task);
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
            url: this.source.url.replace('git:', 'http:').replace('.git', '')
        };
    },

    /**
     * Returns pattern for markdown files
     * @returns {{readme: string, changelog: (*|string), migration: (*|string)}}
     */
    getMdTargets: function() {
        return {
            readme: pattern.getReadme()[this.getSourceName()] || this.MD.README,
            changelog: pattern.getChangelog()[this.getSourceName()] || this.MD.CHANGELOG,
            migration: pattern.getMigration()[this.getSourceName()] || this.MD.MIGRATION
        };
    },

    /**
     * Returns pattern for output files
     * @returns {Object} with fields:
     * - data {String} pattern for data file
     * - jsdoc {String} pattern for jsdoc file
     */
    getBlockTargets: function() {
        return pattern.getPattern()[this.getSourceName()] || this.BLOCK_DEFAULT;
    }
};

module.exports = Target;
