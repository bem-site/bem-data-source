var logger = require('./src/logger'),
    TargetView = require('./src/targets/view'),
    TargetRemove = require('./src/targets/remove');

exports.publish = require('./src/commands/publish').publish;

/**
 * Removes version from registry
 * Also removes all example files from storage
 * @param {String} repo - name of repository (library)
 * @param {String} version - name of version (branch|tag|pr)
 * @param {Boolean} isDryRun - dry run flag
 * @returns {*}
 */
exports.remove = function (repo, version, isDryRun) {
    logger.setProductionMode();

    var target = new TargetRemove(repo, version, { isDryRun: isDryRun });
    return target.execute().fail(function() { process.exit(1); });
};

/**
 * View registry data
 * @param {String} repo - name of repository (library)
 * @param {String} version - name of version (branch|tag|pr)
 * @returns {Promise}
 */
exports.view = function (repo, version) {
    logger.setProductionMode();
    var target = new TargetView(repo, version, { isCli: false });
    return target.execute().fail(function() { process.exit(1); });
};
