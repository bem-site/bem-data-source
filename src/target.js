/* global toString: false */
'use strict';

var util = require('util'),
    path = require('path'),

    vow = require('vow'),
    vowFs = require('vow-fs'),

    constants = require('./constants'),
    libs = require('./libs'),
    collectSets = require('./tasks/collect_sets');

var Target = function(source, ref, type) {
    return this.init(source, ref, type);
};

Target.prototype = {

    source: null,
    ref: null,
    type: null,
    tasks: [],

    init: function(source, ref, type) {
        this.source = source;
        this.ref = ref;
        this.type = type;

        return this
            .addTask(function(t) {
                return vow.all([
                    vowFs.removeDir(t.getContentPath()),
                    vowFs.removeDir(t.getOutputPath())
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
            .addTask(libs.cmd.npmRunDeps) //bower or bem make libs
            .addTask(libs.cmd.bemMakeSets) //bem make sets
            .addTask(libs.cmd.moveSets) //move sets to output folder
            .addTask(collectSets); //collect sets
    },

    /**
     * Returns constructed name of task from source and ref names
     * @returns {string}
     */
    getName: function() {
        return util.format('%s %s', this.source.name, this.ref);
    },

    getSourceName: function() {
        return this.source.name;
    },

    /**
     * Returns path to task subdirectory in content folder
     * @returns {string}
     */
    getContentPath: function() {
        return path.join(constants.DIRECTORY.CONTENT, this.source.name, this.ref);
    },

    /**
     * Returns path to task subdirectory in output folder
     * @returns {string}
     */
    getOutputPath: function() {
        return path.join(constants.DIRECTORY.OUTPUT, this.source.name, this.ref);
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
        var initial = this.tasks.shift();
        return this.tasks.reduce(function(prev, item) {
            return prev.then(function() {
                return item.call(null, this);
            });
        }, initial.call(null, this));
    },

    createSetsResultBase: function() {
        return {
            repo: this.source.name,
            ref: this.ref,
            url: this.source.url.replace('git:', 'http:').replace('.git', '')
        };
    }
};

module.exports = Target;
