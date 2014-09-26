'use strict';

var fs = require('fs-extra'),
    util = require('util'),
    cp = require('child_process'),

    md = require('marked'),
    vow = require('vow'),
    Rsync = require('rsync'),

    api = require('./gh-api'),
    renderer = require('./renderer'),
    logger = require('./logger');

/**
 * Executes specified command with options.
 * @param {String} cmd (command) to execute.
 * @param {Object} options to `child_process.exec()` function.
 * @return {Promise}
 */
exports.exec = function (cmd, options) {
    var proc = cp.exec(cmd, options),
        d = vow.defer(),
        output = '';

    proc.on('exit', function (code) {
        if (code === 0) {
            return d.resolve();
        }
        d.reject(new Error(util.format('%s failed: %s', cmd, output)));
    });

    proc.stderr.on('data', function (data) {
        logger.verbose(data, module);
        output += data;
    });

    proc.stdout.on('data', function (data) {
        logger.verbose(data, module);
        output += data;
    });

    return d.promise();
};

/**
 * Converts markdown content into html with marked module
 * @param {String} content of markdown file
 * @returns {String} - html string
 */
exports.mdToHtml = function (content) {
    return md(content, {
        gfm: true,
        pedantic: false,
        sanitize: false,
        renderer: renderer.get()
    });
};

/**
 * Removes directory with all files and subdirectories
 * @param {String} path to directory on filesystem
 * @returns {*}
 */
exports.removeDir = function (path) {
    var def = vow.defer();
    fs.remove(path, function (err) {
        if (err) {
            def.reject(err);
        }
        def.resolve();
    });

    return def.promise();
};

exports.copy = function (target, destination) {
    var def = vow.defer();
    fs.copy(target, destination, function (err) {
        if (err) {
            def.reject(err);
        }
        def.resolve();
    });

    return def.promise();
};

/**
 * Retrieve github ssh url via github api
 * @param {Object} repo object
 * @returns {*}
 */
exports.getSSHUrl = function (repo) {
    return api
        .getRepository({
            user: repo.user,
            name: repo.repo,
            isPrivate: repo.private
        })
        .then(function (res) {
            return res.result['ssh_url'];
        })
        .fail(function () {
            logger.error('Data repository was not found. Application will be terminated', module);
        });
};

/**
 * Runs rsync command with options
 * @param {Object} options - options for rsync command
 * @returns {*}
 */
exports.rsync = function (options) {
    var def = vow.defer(),
        rsync = Rsync.build(options);

    logger.debug(util.format('rsync command: %s', rsync.command()), module);
    rsync.execute(function(err, code) {
        if(err) {
            logger.error(util.format('Rsync failed wit error %s', err.message), module)
            def.reject(err);
        }else {
            def.resolve(code);
        }
    });
    return def.promise();
};
