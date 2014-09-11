'use strict';

var Target = require('./target')

var TargetPublish  = function (source, ref) {
    return this.init(source, ref, null);
};

TargetPublish.prototype = Target.prototype;

TargetPublish.prototype.getContentPath = function() {
    return process.cwd();
};

TargetPublish.prototype.getOutputPath = function() {
    return process.cwd();
};

TargetPublish.prototype.getTasks = function() {
    return [require('./tasks/collect-sets')];
};

module.exports = TargetPublish;
