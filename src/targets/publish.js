'use strict';

var fs = require('fs'),
    path = require('path'),

    vow = require('vow'),
    inherit = require('inherit'),
    constants = require('./../constants'),
    Base = require('./base');

module.exports = inherit(Base, {

    _options: undefined,

    __constructor: function (ref, options) {
        var packageJson = this._readPackageJson();
        ref = ref || packageJson.version;
        ref = ref.replace(/\//g, '-');

        var repository = packageJson['repository'];

        this.__base({
            name: packageJson.name,
            url: repository && repository.url
        }, ref);

        this._options = options;
        this._tasks = [
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
        var _this = this;
        return this._tasks.reduce(function (prev, item) {
            return prev.then(function () {
                return item(_this);
            });
        }, vow.resolve(this.createResultBase()));
    },

    /**
     * Reads and parses package.json file of library
     * @returns {Object} parsed content of package.json file or throws error id given file doesn't exists
     * @private
     */
    _readPackageJson: function () {
        try {
            var content = fs.readFileSync(path.join(this.contentPath, 'package.json'), { encoding: 'utf-8' });
            return JSON.parse(content);
        } catch (err) {
            throw new Error('package.json file can not be opened or parsed');
        }
    },

    /**
     * Returns content path for target
     * @returns {String}
     */
    get contentPath() {
        return process.cwd();
    },

    /**
     * Returns path temp folder
     * @returns {String}
     */
    get tempPath() {
        return path.join(process.cwd(), constants.DIRECTORY.TEMP);
    },

    get options() {
        return this._options;
    }
});
