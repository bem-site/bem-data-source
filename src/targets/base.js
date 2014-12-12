'use strict';

var util = require('util'),
    path = require('path'),

    _ = require('lodash'),

    titles = require('./../titles'),
    constants = require('./../constants'),

    Target = function (source, ref, type) {
        return this.init(source, ref, type);
    };

Target.prototype = {
    source: null,
    ref: null,
    type: null,
    declaration: null,

    /**
     * Initialize target for build
     *
     * @param {Object} source
     * @param {String} ref - name of tag or branch
     * @param {String} type of reference
     * @returns {Target}
     */
    init: function (source, ref, type) {
        this.source = source;
        this.ref = ref;
        this.type = type;
        this.declaration = this.makeDeclaration();
        return this;
    },

    /**
     * Retrieve merged declaration for library
     * @returns {Boolean|*}
     */
    makeDeclaration: function () {
        var base = require('../../declarations/base'),
            lib;

        try {
            lib = require('../declarations/' + this.getSourceName());
        }catch (err) {
            lib = { default: {} };
        }

        var declaration = _.extend(base.default, lib.default);
        if (lib.default.docs && _.isObject(lib.default.docs)) {
            declaration.docs = _.extend(base.default.docs, lib.default.docs);
        }
        return declaration;
    },

    /**
     * Returns human readable name for target
     * @returns {String}
     */
    getName: function () {
        return util.format('%s %s', this.getSourceName(), this.ref);
    },

    /**
     * Returns name of library
     * @returns {String}
     */
    getSourceName: function () {
        return this.source.name;
    },

    /**
     * Returns source privacy flag
     * @returns {boolean}
     */
    getSourcePrivacy: function () {
        return this.source.isPrivate;
    },

    /**
     * Return gh url for library
     * @returns {String}
     */
    getUrl: function () {
        return this.source.url;
    },

    /**
     * Return part of declaration corresponding to docs
     * @returns {*}
     */
    getMdTargets: function () {
        return this.declaration.docs;
    },

    /**
     * Returns name patters of folders that should be copied to output folder
     * @returns {*}
     */
    getBlockTargets: function () {
        return this.declaration.pattern;
    },

    /**
     * Returns value if build command
     * @returns {String}
     */
    getBuildCommand: function () {
        return this.declaration.command;
    },

    /**
     * Returns array of masks for folder names that should be copied
     * from content to output directory
     * @returns {Array}
     */
    getRsyncConfiguration: function () {
        return this.declaration.rsync;
    },

    /**
     *
     * @returns {*}
     */
    getDocPatterns: function () {
        return this.declaration.docDirs;
    },

    /**
     * Returns name of builder
     * @returns {String}
     */
    getBuilderName: function () {
        return this.declaration.builder;
    },

    /**
     *
     * @returns {*|exports}
     */
    getTitles: function () {
        return titles;
    },

    /**
     * Returns array of tasks that should be executed for target
     * in the same order as they were written
     * @returns {Array}
     */
    getTasks: function () {
        if (this.source.docsOnly) {
            return [
                require('./../tasks/collect-sets')
            ];
        }

        return this.declaration.tasks;
    },

    /**
     * Returns path of library in output folder
     * @returns {String}
     */
    getContentPath: function () {
        return path.join(path.join(constants.DIRECTORY.CONTENT, this.getSourceName()), this.ref.replace(/\//g, '-'));
    },

    /**
     * Returns path of library in output folder
     * @returns {String}
     */
    getOutputPath: function () {
        return path.join(path.join(constants.DIRECTORY.OUTPUT, this.getSourceName()), this.ref.replace(/\//g, '-'));
    },

    /**
    * Returns output path for target
    * @returns {String}
    */
    getTempPath: function () {
        return this.getOutputPath();
    },

    /**
     * Make chained calls for all tasks for target and call them
     * @returns {*}
     */
    execute: function () {
        var _this = this,
            initial = this.getTasks().shift();
        return this.getTasks().reduce(function (prev, item) {
            return prev.then(function () {
                return item(_this);
            });
        }, initial(_this));
    },

    /**
     *
     * @returns {{repo: *, ref: *, url: string}}
     */
    createSetsResultBase: function () {
        return {
            repo: this.getSourceName(),
            ref: this.ref,
            enb: this.getBuilderName() === 'enb',
            url: this.getUrl().replace('git:', 'http:').replace('.git', ''),
            custom: this.getCustom(),
            docs: {}
        };
    },

    /**
     * Add custom pseudo-nodes to library version
     * and set actual library name and version to url pattern
     * @returns {*}
     */
    getCustom: function () {
        return (this.declaration.custom).map(function (item) {
            if (item.url) {
                item.url = item.url
                    .replace('{lib}', this.getSourceName())
                    .replace('{ref}', this.ref);
            }
            return item;
        }, this);
    }
};

module.exports = Target;
