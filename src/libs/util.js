/* global toString: false */
'use strict';

var util = require('util'),
    path = require('path'),
    fs = require('fs'),
    cp = require('child_process'),

    semver = require('semver'),
    q = require('q'),
    q_io = require('q-io/fs'),
    md = require('marked'),
    hl = require('highlight.js'),
    mkdirp = require('mkdirp'),

    logger = require('./logger')(module),
    config = require('../config');

/**
 * Creates directory with given name
 * @param dirName - {String} name of directory
 * @returns {Promise|*|Promise.fail}
 */
// exports.createDirectory = function(dirName) {
//     return q_io
//         .makeDirectory(dirName)
//         .then(function() {
//             logger.debug('%s directory has been created', dirName);
//         })
//         .fail(function(err) {
//             if(err.code === 'EEXIST') {
//                 logger.warn('%s directory already exist', dirName);
//             }
//         });
// };

exports.createDirectory = function(dirName) {
    var def = q.defer();

    q.nfapply(mkdirp, [dirName])
    .then(
        function(result) {
            def.resolve(dirName);
            logger.debug('%s directory has been created', dirName);
        },
        function(err) {
            if(err.code === 'EEXIST') {
                def.resolve(dirName);
                logger.warn('%s directory already exist', dirName);
            }else {
                def.reject(err.message);    
            }
        }
    );
    return def.promise;
};

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
 * Filter promises collection by fulfilled criteria and post processing them
 * @param promises - {Array} array of promises
 * @param mapCallback - {Function} callback function for map
 * @returns {Array|*}
 */
exports.filterAndMapFulfilledPromises = function(promises, mapCallback) {
    return promises
        .filter(
            function(item) {
                return item.state === 'fulfilled';
            }
        )
        .map(mapCallback);
};

/**
 * Filter promises collection by fulfilled criteria and post processing them
 * @param promises - {Array} array of promises
 * @returns {Array|*}
 */
exports.filterFulfilledPromises = function(promises) {
    return promises.filter(
        function(item) {
            return item.state === 'fulfilled';
        }
    );
};

/**
 * Executes specified command with options.
 * @param {String} cmd  Command to execute.
 * @param {Object} options  Options to `child_process.exec()` function.
 * @return {Promise * String | Undefined}
 */
exports.exec = function(cmd, options) {
    var proc = cp.exec(cmd, options),
        d = q.defer(),
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

    return d.promise;
};

/**
 * Check if current path is directory
 * @param path {String} path
 * @returns {Boolean}
 */
exports.isDirectory = function(path) {
    try {
        return fs.statSync(path).isDirectory();
    } catch(ignore) {}
    return false;
};

/**
 * Returns list of directory names for _path
 * @param _path {String} path
 * @returns {Array} array of directory names, sorted alphabetically
 */
exports.getDirs = function(_path) {
    try {
        return exports.isDirectory(_path)?
            fs.readdirSync(_path)
                .filter(function(d) {
                    return !(/^\.svn$/.test(d)) && exports.isDirectory(path.join(_path, d));
                })
                .sort() :
            [];
    } catch (e) {
        return [];
    }
};

exports.getDirsAsync = function(_path) {
    return q_io.list(_path).then(function(items) {
        return q.all(items.map(function(i) {
                return q_io.isDirectory(path.join(_path, i))
                    .then(function(isDir){
                        return {
                            name: i,
                            dir: isDir
                        };
                    }
                );
            }))
            .then(function(items) {
                return items
                    .filter(function(item) {
                        return item.dir;
                    })
                    .map(function(item) {
                        return item.name;
                    });
            }
        );
    });
};

exports.mdToHtml = function(content) {
    var languages = {};

    return md(content, {
            gfm: true,
            pedantic: false,
            sanitize: false,
            highlight: function(code, lang) {
                if (!lang) {
                    return code;
                }
                var res = hl.highlight(function(alias) {
                    return {
                        'js' : 'javascript',
                        'patch': 'diff',
                        'md': 'markdown',
                        'html': 'xml',
                        'sh': 'bash'
                    }[alias] || alias;
                }(lang), code);

                languages[lang] = res.language;
                return res.value;
            }
        })
        .replace(/<pre><code class="lang-(.+?)">([\s\S]+?)<\/code><\/pre>/gm,
            function(m, lang, code) {
                return '<pre class="highlight"><code class="highlight__code ' + languages[lang] + '">' + code + '</code></pre>';
            }
        );
};
