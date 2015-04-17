'use strict';

var fs = require('fs'),
    path = require('path'),

    vow = require('vow'),
    inherit = require('inherit'),
    fsExtra = require('fs-extra'),
    constants = require('./../constants'),
    Base = require('./base');

module.exports = inherit(Base, {

    _options: undefined,
    _contentPath: undefined,
    _tempPath: undefined,

    __constructor: function (ref, options) {
        this._options = options;
        this._contentPath = process.cwd();
        this._tempPath = path.join(this._contentPath, constants.DIRECTORY.TEMP);

        var packageJson = this._readPackageJson();
        ref = ref || packageJson.version;
        ref = ref.replace(/\//g, '-');

        var repository = packageJson['repository'];

        this.__base({
            name: packageJson.name,
            url: repository && repository.url
        }, ref);

        this._tasks = [
            new (require('../tasks/check-issues'))(this),
            new (require('../tasks/read-md'))(this),
            new (require('../tasks/read-deps'))(this),
            new (require('../tasks/read-showcase'))(this),
            new (require('../tasks/read-levels'))(this),
            new (require('../tasks/write-result'))(this),
            new (require('../tasks/remove-temp'))(this),
            new (require('../tasks/create-temp'))(this),
            new (require('../tasks/copy-to-temp'))(this),
            new (require('../tasks/send-examples'))(this),
            new (require('../tasks/send-doc'))(this),
            new (require('../tasks/send-email'))(this)
        ];
    },

    /**
     * Make chained calls for all tasks for target and call them
     * @returns {*}
     */
    execute: function () {
        return this._tasks.reduce(function (prev, item) {
            return prev.then(function (r) {
                return item.run(r);
            });
        }, vow.resolve(this.createResultBase()));
    },

    /**
     * Reads and parses package.json file of library
     * @returns {Object} parsed content of package.json file or throws error id given file doesn't exists
     * @private
     */
    _readPackageJson: function () {
        return fsExtra.readJSONFileSync(path.join(this._contentPath, 'package.json'));
    },

    /**
     * Returns content path for target
     * @returns {String}
     */
    getContentPath: function () {
        return this._contentPath;
    },

    /**
     * Returns path temp folder
     * @returns {String}
     */
    getTempPath: function () {
        return this._tempPath;
    },

    getOptions: function () {
        return this._options;
    }
});
