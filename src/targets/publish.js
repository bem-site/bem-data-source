'use strict';

var fs = require('fs'),
    path = require('path'),

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
            require('../tasks/collect-sets'),
            require('../tasks/remove-temp'),
            require('../tasks/create-temp'),
            require('../tasks/copy-to-temp'),
            require('../tasks/process-examples'),
            require('../tasks/send-doc'),
            require('../tasks/send-email')
        ];
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
    }
});
