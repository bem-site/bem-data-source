'use strict';

var TargetPublish = require('./publish'),
    TargetPrepare  = function (ref, options) {
        this.init(ref, options);
    };

TargetPrepare.prototype = Object.create(TargetPublish.prototype);

TargetPrepare.prototype.init = function (ref, options) {
    TargetPublish.prototype.init.call(this, ref, options);
    this.declaration.tasks = [
        require('../tasks/collect-sets'),
        require('../tasks/remove-temp'),
        require('../tasks/create-temp'),
        require('../tasks/copy-to-temp')
    ];
};

module.exports = TargetPrepare;
