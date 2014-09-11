'use strict';

var Target = require('./target')

var PTarget  = function (source, ref) {
    return this.init(source, ref, null);
};

PTarget.prototype = Target.prototype;

PTarget.prototype.getContentPath = function() {
    return process.cwd();
};

PTarget.prototype.getOutputPath = function() {
    return process.cwd();
};

PTarget.prototype.getTasks = function() {
    return [require('./tasks/collect-sets')];
};
