var logger = require('./src/logger'),
    TargetView = require('./src/targets/view'),
    TargetRemove = require('./src/targets/remove');

exports.publish = require('./src/commands/publish').publish;

exports.remove = function (repo, version, options, isDryRun) {
    logger.setProductionMode();

    options.isDryRun = isDryRun;
    var target = new TargetRemove(repo, version, options);
    return target.execute().fail(function() { process.exit(1); });
};

exports.view = function (repo, version) {
    logger.setProductionMode();
    var options = { isCli: false},
        target = new TargetView(repo, version, options);
    return target.execute().fail(function() { process.exit(1); });
};
