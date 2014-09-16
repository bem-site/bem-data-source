'use strict';

var Target = require('./target'),
    TargetPublish  = function (source, ref) {
        this.init(source, ref, null);
        this.declaration.tasks = [
            require('./tasks/collect-sets'),
            require('./tasks/clean-unused'),
            require('./tasks/archive')
        ];
        this.getContentPath = function () {
            return process.cwd();
        };
        this.getOutputPath = function () {
            return process.cwd();
        };
        return this;
    };

TargetPublish.prototype = Target.prototype;

module.exports = TargetPublish;
