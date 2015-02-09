'use strict';

var fs = require('fs'),
    path = require('path'),

    constants = require('./../constants'),
    Target = require('./base'),

    TargetPublish  = function (ref, options) {
        this.init(ref, options);
    };

TargetPublish.prototype = Object.create(Target.prototype);

TargetPublish.prototype._readPackageJson = function () {
    var content = fs.readFileSync(path.join(process.cwd(), 'package.json'), { encoding: 'utf-8' });
    try {
        return JSON.parse(content);
    } catch (err) {
        return null;
    }
};

TargetPublish.prototype.init = function (ref, options) {
    var packageJson = this._readPackageJson();
    if (!packageJson) {
        throw new Error('package.json file can not be parsed');
    }

    ref = ref || packageJson.version;
    ref = ref.replace(/\//g, '-');

    var repository = packageJson.repository;

    Target.prototype.init.call(this, {
        name: packageJson.name,
        url: repository && repository.url,
        isPrivate: true
    }, ref);

    this.options = options;
    this.declaration.tasks = [
        require('../tasks/collect-sets'),
        require('../tasks/remove-temp'),
        require('../tasks/create-temp'),
        require('../tasks/copy-to-temp'),
        require('../tasks/process-examples'),
        require('../tasks/send-doc'),
        require('../tasks/send-email')
    ];
};

/**
 * Returns content path for target
 * @returns {String}
 */
TargetPublish.prototype.getContentPath = function () {
    return process.cwd();
};

/**
 * Returns output path for target
 * @returns {String}
 */
TargetPublish.prototype.getOutputPath = function () {
    return process.cwd();
};

/**
 * Returns output path for target
 * @returns {String}
 */
TargetPublish.prototype.getTempPath = function () {
    return path.join(process.cwd(), constants.DIRECTORY.TEMP);
};

module.exports = TargetPublish;
