'use strict';

var util = require('util'),

    inherit = require('inherit'),
    _ = require('lodash'),
    vow = require('vow'),

    titles = require('../titles');

module.exports = inherit({
    _source: undefined,
    _ref: undefined,
    _declaration: undefined,
    _tasks: undefined,

    /**
     * Constructor function
     * @param {Object} source object. Should have fields:
     * - {String} name of library (from package.json file)
     * - {String} url of library (from source field of package.json file)
     * @param {String} ref - version of library
     * @private
     */
    __constructor: function (source, ref) {
        this._source = source;
        this._ref = ref;
        this._declaration = this._makeDeclaration();
        this._tasks = [];
    },

    /**
     * Retrieve merged declaration for library
     * @returns {Object}
     * @private
     */
    _makeDeclaration: function () {
        var base = require('../../declarations/base'),
            lib;

        try {
            lib = require('../../declarations/' + this.sourceName);
        }catch (err) {
            lib = { default: {} };
        }

        var declaration = _.extend({}, base.default, lib.default);
        if (lib.default.docs && _.isObject(lib.default.docs)) {
            declaration.docs = lib.default.docs;
        }
        return declaration;
    },

    /**
     * Returns human readable name for target
     * @returns {String}
     */
    get name() {
        return util.format('%s %s', this.sourceName, this._ref);
    },

    get ref() {
        return this._ref;
    },

    /**
     * Returns name of library
     * @returns {String}
     */
    get sourceName() {
        return this._source.name;
    },

    /**
     * Return gh url for library
     * @returns {String}
     */
    get url() {
        return this._source.url;
    },

    /**
     * Return part of declaration corresponding to docs
     * @returns {*}
     */
    get mdTargets() {
        return this._declaration.docs;
    },

    /**
     * Returns name patters of folders that should be copied to output folder
     * @returns {*}
     */
    get blockTargets() {
        return this._declaration.pattern;
    },

    /**
     * Returns array of masks for folder names
     * that should be synchronized to output directory before sending them to remote host
     * @returns {Array}
     */
    get rsyncConfiguration() {
        return this._declaration.rsync;
    },

    /**
     *
     * @returns {*}
     */
    get docPatterns() {
        return this._declaration.docDirs;
    },

    /**
     * Returns object with localized titles for library documents
     * @returns {*|exports}
     */
    get titles() {
        return titles;
    },

    /**
     * Add custom pseudo-nodes to library version
     * and set actual library name and version to url pattern
     * @returns {*}
     */
    get custom() {
        return this._declaration.custom.map(function (item) {
            if (item.url) {
                item.url = item.url
                    .replace('{lib}', this.sourceName)
                    .replace('{ref}', this._ref);
            }
            return item;
        }, this);
    },

    /**
     * Retrieves optional showcase setting for build showcase page for library
     * @returns {*|exports.default.showcase|null}
     */
    get showCase() {
        return this._declaration.showcase || null;
    },

    /**
     * Make chained calls for all tasks for target and call them
     * @returns {*}
     */
    execute: function () {
        return this._tasks.reduce(function (prev, item) {
            return prev.then(function () {
                return item.run();
            });
        }, vow.resolve());
    },

    /**
     * Creates result backbone object for build full data.json file
     * @returns {{repo: *, ref: *, url: string}}
     */
    createResultBase: function () {
        return {
            repo: this.sourceName,
            ref: this._ref,
            enb: this._declaration.builder === 'enb',
            url: this.url.replace('git:', 'http:').replace('.git', ''),
            sourceUrl: this.sourceUrl,
            custom: this.custom,
            showcase: this.showCase,
            docs: {}
        };
    }
});
