'use strict';

var util = require('util'),
    path =require('path'),

    _ = require('lodash'),

    pattern = require('../config/pattern'),
    titles = require('./titles'),
    constants = require('./constants'),

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
            return this[item];
        }, this);

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

    /**
     *
     * @returns {*}
     */
    getMdTargets: function() {
        return _.extend(this.def.docs, pattern[this.getSourceName()].docs || {});
    },

    /**
     *
     * @returns {*}
     */
    getBlockTargets: function() {
        return pattern[this.getSourceName()].pattern || this.def.pattern;
    },

    /**
     *
     * @returns {String}
     */
    getBuildCommand: function() {
        return pattern[this.getSourceName()].command || this.def.command;
    },

    /**
     * Returns array of masks for folder names that should be copied
     * from content to output directory
     * @returns {Array}
     */
    getCopyPatterns: function() {
        return pattern[this.getSourceName()].copy || this.def.copy;
    },

    /**
     *
     * @returns {*}
     */
    getDocPatterns: function() {
        return this.getCopyPatterns()[0];
    },

    /**
     * Returns name of builder
     * @returns {String}
     */
    getBuilderName: function() {
        return pattern[this.getSourceName()].builder || this.def.builder;
    },

    /**
     *
     * @returns {*|exports}
     */
    getTitles: function() {
        return titles;
    },

    /**
     * Returns array of tasks that should be executed for target
     * in the same order as they were written
     * @returns {Array}
     */
    getTasks: function() {
        if(this.source.docsOnly) {
            return  [
                require('./commands/remove-output'),
                require('./commands/create-output'),
                require('./commands/git-clone'),
                require('./commands/git-checkout'),
                require('./commands/collect-sets')
            ];
        }

        return pattern[this.getSourceName()].tasks || _.values(this.def.tasks);
    },

    /**
     * Returns path of library in output folder
     * @returns {String}
     */
    getContentPath: function() {
        return path.join(path.join(constants.DIRECTORY.CONTENT, this.source.name), this.ref.replace(/\//g, '-'));
    },

    /**
     * Returns path of library in output folder
     * @returns {String}
     */
    getOutputPath: function() {
        return path.join(path.join(constants.DIRECTORY.OUTPUT, this.source.name), this.ref.replace(/\//g, '-'));
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
                return item.apply(_this);
            });
        }, initial.apply(this));
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
