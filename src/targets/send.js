'use strict';

var TargetPublish = require('./publish'),
    TargetSend  = function (ref, options) {
        this.init(ref, options);
    };

TargetSend.prototype = Object.create(TargetPublish.prototype);

TargetSend.prototype.init = function (ref, options) {
    TargetPublish.prototype.init.call(this, ref, options);
    this.declaration.tasks = [
        require('../tasks/process-examples'),
        require('../tasks/send-doc'),
        require('../tasks/send-email')
    ];
};

module.exports = TargetSend;
