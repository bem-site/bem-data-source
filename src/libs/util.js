'use strict';

var util = require('util'),
    cp = require('child_process'),

    fs = require('fs-extra'),
    semver = require('semver'),
    vow = require('vow'),
    md = require('marked'),

    renderer = require('./renderer'),
    logger = require('./logger')(module);

/**
 * Sort tags function
 * @param a - {String} first tag value
 * @param b - {String} second tag value
 * @returns {number}
 */
exports.sortTags = function(a, b) {
    a = semver.clean(a);
    b = semver.clean(b);
    if(semver.valid(a) !== null && semver.valid(b) !== null) {
        return semver.gt(a, b) ? 1 : (semver.lt(a, b) ? -1 : 0);
    }else {
        return a - b;
    }
};

/**
 * Executes specified command with options.
 * @param {String} cmd  Command to execute.
 * @param {Object} options  Options to `child_process.exec()` function.
 * @return {Promise * String | Undefined}
 */
exports.exec = function(cmd, options) {
    var proc = cp.exec(cmd, options),
        d = vow.defer(),
        output = '';

    proc.on('exit', function(code) {
        if (code === 0) {
            return d.resolve();
        }
        d.reject(new Error(util.format('%s failed: %s', cmd, output)));
    });

    proc.stderr.on('data', function(data) {
        logger.verbose(data);
        output += data;
    });

    proc.stdout.on('data', function(data) {
        logger.verbose(data);
        output += data;
    });

    return d.promise();
};

/**
 * Converts markdown content into html with marked module
 * @param content - {String} markdown content
 * @returns {String} - html string
 */
exports.mdToHtml = function(content) {
    return md(content, {
        gfm: true,
        pedantic: false,
        sanitize: false,
        renderer: renderer.getRenderer()
    });
};

/**
 * Removes directory with all files and subdirectories
 * @param path - {String} path to directory on filesystem
 * @returns {*}
 */
exports.removeDir = function(path) {
    var def = vow.defer();
    fs.remove(path, function(err) {
        if(err) {
            def.reject(err);
        }

        def.resolve();
    });

    return def.promise();
};

/**
 * Retrieve github ssh url via github api
 * @param repo - {Object} repo object
 * @returns {*}
 */
exports.getSSHUrl = function(repo) {
    return require('./api')
        .getRepository({
            user: repo.user,
            name: repo.repo,
            isPrivate: repo.private
        })
        .then(
            function(res) {
                return res.result.ssh_url;
            },
            function() {
                logger.error('Data repository was not found. Application will be terminated');
            }
        );
};
