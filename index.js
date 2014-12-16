var logger = require('./src/logger'),
    TargetView = require('./src/targets/view'),
    TargetRemove = require('./src/targets/remove'),
    TargetPublish = require('./src/targets/publish');

/**
 * Publish library data to storage
 * @param {String} version - name of version (branch|tag|pr)
 * @param {Object} options - options object with fields:
 * - {Boolean} debug - flag for storage
 * - {String} namespace - storage key namespace
 * @param {Boolean} isDryRun - dry run flag
 * @returns {*}
 */
exports.publish = function (version, options, isDryRun) {
    logger.setProductionMode();
    options.isDryRun = isDryRun;
    var target = new TargetPublish(version, options);
    return target.execute().fail(function () { process.exit(1); });
};

/**
 * View registry data
 * @param {String} repo - name of repository (library)
 * @param {String} version - name of version (branch|tag|pr)
 * @param {Object} options - options object with fields:
 * - {Boolean} debug - flag for storage
 * - {String} namespace - storage key namespace
 * @returns {Promise}
 */
exports.view = function (repo, version, options) {
    logger.setProductionMode();
    options.isCli = false;
    var target = new TargetView(repo, version, options);
    return target.execute().fail(function () { process.exit(1); });
};

/**
 * Removes version from registry
 * Also removes all example files from storage
 * @param {String} repo - name of repository (library)
 * @param {String} version - name of version (branch|tag|pr)
 * @param {Object} options - options object with fields:
 * - {Boolean} debug - flag for storage
 * - {String} namespace - storage key namespace
 * @param {Boolean} isDryRun - dry run flag
 * @returns {*}
 */
exports.remove = function (repo, version, options, isDryRun) {
    logger.setProductionMode();
    options.isDryRun = isDryRun;
    var target = new TargetRemove(repo, version, options);
    return target.execute().fail(function () { process.exit(1); });
};
