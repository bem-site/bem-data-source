'use strict';

var Target = require('./target');

var TargetPublish  = function (source, ref) {
    this.init(source, ref, null);
    this.declaration.tasks = [
        require('./tasks/collect-sets'),
        require('./tasks/archive')
    ];
    this.getContentPath = function() {
        return process.cwd();
    };
    this.getOutputPath = function() {
        return process.cwd();
    };
    return  this;
};

TargetPublish.prototype = Target.prototype;

module.exports = TargetPublish;
