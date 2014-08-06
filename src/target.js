'use strict';

var util = require('util'),
    path = require('path'),

    _ = require('lodash'),

    libs = require('./libs'),
    constants = require('./constants'),
    pattern = require('../config/pattern'),
    titles = require('../config/titles'),

    Target = function(source, ref, type) {
        return this.init(source, ref, type);
    };

Target.prototype = {

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
        tasks: constants.TASKS,
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

        this.tasks = this.getTasks().map(function(item) {
            return libs.cmd[item];
        });

        return this;
    },

    /**
     * Returns human readable name for target
     * @returns {String}
     */
    getName: function() {
        return util.format('%s %s', this.source.name, this.ref);
    },

    /**
     * Returns name of library
     * @returns {String}
     */
    getSourceName: function() {
        return this.source.name;
    },

    /**
     * Returns source privacy flag
     * @returns {boolean}
     */
    getSourcePrivacy: function() {
        return this.source.isPrivate;
    },

    /**
     * Return gh url for library
     * @returns {String}
     */
    getUrl: function() {
        return this.source.url;
    },

    getMdTargets: function() {
        return _.extend(this.def.docs, pattern[this.getSourceName()].docs || {});
    },

    getBlockTargets: function() {
        return pattern[this.getSourceName()].pattern || this.def.pattern;
    },

    getBuildCommand: function() {
        return pattern[this.getSourceName()].command || this.def.command;
    },

    getCopyPatterns: function() {
        return pattern[this.getSourceName()].copy || this.def.copy;
    },

    getDocPatterns: function() {
        return this.getCopyPatterns()[0];
    },

    getBuilderName: function() {
        return pattern[this.getSourceName()].builder || this.def.builder;
    },

    getTitles: function() {
        return titles;
    },

    getTasks: function() {
        if(this.source.docsOnly) {
            return  [
                constants.TASKS.REMOVE_OUTPUT,
                constants.TASKS.CREATE_OUTPUT,
                constants.TASKS.GIT_CLONE,
                constants.TASKS.GIT_CHECKOUT,
                constants.TASKS.COLLECT_SETS
            ];
        }

        return pattern[this.getSourceName()].tasks || this.def.tasks;
    },

    /**
     * Returns path of library in output folder
     * @returns {String}
     */
    getContentPath: function() {
        return path.join(constants.DIRECTORY.CONTENT, this.source.name, this.ref.replace(/\//g, '-'));
    },

    /**
     * Returns path of library in output folder
     * @returns {String}
     */
    getOutputPath: function() {
        return path.join(constants.DIRECTORY.OUTPUT, this.source.name, this.ref.replace(/\//g, '-'));
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
            custom: this.getCustom(),
            docs: {}
        };
    },

    /**
     * Add custom pseudo-nodes to library version
     * and set actual library name and version to url pattern
     * @returns {*}
     */
    getCustom: function() {
        return (pattern[this.getSourceName()].custom || this.def.custom).map(function(item) {
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
