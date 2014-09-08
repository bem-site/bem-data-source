'use strict';

var path = require('path'),
    util = require('util'),
    vow = require('vow'),
    commander = require('../commander');

/**
 * Executes copying built folders from content to output
 * @returns {defer.promise|*}
 */
module.exports = function (target) {
    return vow.all(target.getCopyPatterns().map(function (item) {
        return commander.runCommand(util.format('cp -R %s %s', item, path.resolve(this.getOutputPath())),
            { cwd: path.resolve(this.getContentPath()) }, util.format('copy folders %s', item), this);
    }, target));
};
