var logger = require('./src/logger'),
    TargetView = require('./src/targets/view'),
    TargetRemove = require('./src/targets/remove'),
    TargetReplace = require('./src/targets/replace'),
    TargetPublish = require('./src/targets/publish');

/**
 * Publish library data to storage
 * @param {String} version - name of version (branch|tag|pr)
 * @param {Object} options - options object with fields:
 * - {Object} storage configuration:
 *    - {String} namespace - storage key namespace
 *    - {Object} get - object with host and port fields that describes
 *      host and port configuration for read requests
 *    - {Object} post - object with host and port fields that describes
 *      host and port configuration for write|modify requests
 *    - {String} auth header
 * - {String} logLevel - logger level (debug, info, warn, error)
 * - {Number} maxOpenFiles - number of open files which can be opened at the same time
 * @param {Boolean} isDryRun - dry run flag
 * @returns {*}
 */
exports.publish = function (version, options, isDryRun) {
    logger.setProductionMode(options.logLevel);
    options.isDryRun = isDryRun;
    var target = new TargetPublish(version, options);
    return target.execute().fail(function () { process.exit(1); });
};

/**
 * View registry data
 * @param {String} repo - name of repository (library)
 * @param {String} version - name of version (branch|tag|pr)
 * @param {Object} options - options object with fields:
 * - {Object} storage configuration:
 *    - {String} namespace - storage key namespace
 *    - {Object} get - object with host and port fields that describes
 *      host and port configuration for read requests
 *    - {Object} post - object with host and port fields that describes
 *      host and port configuration for write|modify requests
 * - {String} logLevel - logger level (debug, info, warn, error)
 * @returns {Promise}
 */
exports.view = function (repo, version, options) {
    logger.setProductionMode(options.logLevel);
    options.isCli = false;
    var target = new TargetView(repo, version, options);
    return target.execute().fail(function () { process.exit(1); });
};

/**
 * Replace documentation data in documentation object
 * @param {String} repo - name of repository (library) required
 * @param {String} version - name of version (branch|tag|pr) required
 * @param {Object} options - options object with fields:
 * - {Object} storage configuration:
 *    - {String} namespace - storage key namespace
 *    - {Object} get - object with host and port fields that describes
 *      host and port configuration for read requests
 *    - {Object} post - object with host and port fields that describes
 *      host and port configuration for write|modify requests
 *    - {String} auth header
 * - {String} logLevel - logger level (debug, info, warn, error)
 * - {String} doc - doc key (readme|changelog|migration|notes) required
 * - {String} lang - language param (en|ru) required
 * - {String} url - url for new document on github (like in browser view) required
 * @returns {Promise}
 */
exports.replace = function (repo, version, options) {
    logger.setProductionMode(options.logLevel);
    options.isCli = false;
    var target = new TargetReplace(repo, version, options);
    return target.execute().fail(function () { process.exit(1); });
};

/**
 * Removes version from registry
 * Also removes all example files from storage
 * @param {String} repo - name of repository (library)
 * @param {String} version - name of version (branch|tag|pr)
 * @param {Object} options - options object with fields:
 * - {Object} storage configuration:
 *    - {String} namespace - storage key namespace
 *    - {Object} get - object with host and port fields that describes
 *      host and port configuration for read requests
 *    - {Object} post - object with host and port fields that describes
 *      host and port configuration for write|modify requests
 *    - {String} auth header
 * - {String} logLevel - logger level (debug, info, warn, error)
 * - {Number} maxOpenFiles - number of open files which can be opened at the same time
 * @param {Boolean} isDryRun - dry run flag
 * @returns {*}
 */
exports.remove = function (repo, version, options, isDryRun) {
    logger.setProductionMode(options.logLevel);
    options.isDryRun = isDryRun;
    var target = new TargetRemove(repo, version, options);
    return target.execute().fail(function () { process.exit(1); });
};
