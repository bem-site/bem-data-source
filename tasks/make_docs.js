/* global toString: false */
'use strict';

var UTIL = require('util'),

    MARKED = require('marked'),
    HIGHLIGHT = require('highlight.js'),
    SHMAKOWIKI = require('shmakowiki'),
    SHA = require('sha1'),

    BEM = require('bem'),
    Q = BEM.require('q'),
    PATH = BEM.require('./path'),
    LOGGER = BEM.require('./logger'),
    U = BEM.require('./util'),
    _ = BEM.require('underscore'),

    //application modules
    util = require('../libs/util');

/**
 *
 * @param target
 * @returns {defer.promise|*}
 */
var execute = function(target) {
    LOGGER.debug(UTIL.format('make docs start for target %s', target.name));

    var def = Q.defer(),
        docDirs = target.docDirs;

    if(!docDirs) {
        def.reject(new Error(UTIL.format('docDir property for target %s undefined', target.name)));
    }else if(!_.isArray(docDirs)) {
        def.reject(new Error(UTIL.format('docDir property for target %s must be array', target.name)));
    } else {
        if(docDirs.length === 0) {
            docDirs = [''];
        }

        Q.allSettled(docDirs.map(function(dir) {
            return readDirectories.apply(null, [target, dir]);
        }))
        .then(
            function(result) {
                //collect parsed files content
                //merge, post-process and write to separate files by localization
                var writeFiles = collectResults(result).map(function(item) {
                    return U.writeFile(
                        PATH.join(target.path, item.lang) + '.json',
                        JSON.stringify(item.data, null, 4)
                    );
                });

                Q.all(writeFiles).then(function() {
                    def.resolve(target);
                });
            },
            function(err) {
                def.reject(err);
            }
        );
    }
    return def.promise;
};

/**
 * Reads documents folder
 * @param arguments - {Array} - array with elements:
 * [0] - {Object} target object,
 * [1] - {String} name of one of documentation directories of repository
 * @returns {*|Promise|then}
 */
var readDirectories = function() {
    var args = Array.prototype.slice.call(arguments),
        target = args[0],
        dir = args[1];

    LOGGER.silly(
        UTIL.format('make docs: read docs directory %s for target %s',
            dir.length > 0 ? dir : 'root', target.name));

    return U.getDirsAsync(PATH.join(target.path, dir))
        .then(function(directories) {
            return Q.allSettled(directories
                    .filter(util.filterDocDirectory)
                    .map(function(docName) {
                        return readDirectory.apply(
                            null, _.union(args, [docName, PATH.join(target.path, dir, docName)])
                        );
                    })
            );
        });
};

/**
 * Reads single document folder
 * @param arguments - {Array} - array with elements:
 * [0] - {Object} target object,
 * [1] - {String} name of one of documentation directories of repository
 * [2] - {String} name of doc directory (name of article)
 * [3] - {String} path to the doc directory
 * @returns {*|Promise|then}
 */
var readDirectory = function() {
    var args = Array.prototype.slice.call(arguments),
        target = args[0],
        docName = args[2],
        path = args[3];

    LOGGER.silly(
        UTIL.format('make docs: read doc directory %s for target %s',
            docName, target.name));

    return U.getFilesAsync(path)
        .then(function(files) {
            return Q.allSettled(files
                    .filter(function(fileName) {
                        return util.filterDocFile(fileName, docName);
                    })
                    .map(function(fileName) {
                        return readFile.apply(
                            null, _.union(_.initial(args), [PATH.join(path, fileName), fileName]));
                    })
            );
        });
};

/**
 * Reads single file
 * @param arguments - {Array} - array with elements:
 * [0] - {Object} target object,
 * [1] - {String} name of one of documentation directories of repository
 * [2] - {String} name of doc directory (name of article)
 * [3] - {String} path to the doc file
 * [4] - {String} file name
 * @returns {*|Promise|then}
 */
var readFile = function() {
    var args = Array.prototype.slice.call(arguments),
        target = args[0],
        path = args[3],
        fileName = args[4];

    LOGGER.silly(
        UTIL.format('make docs: read file %s for target %s',
            fileName, target.name));

    return U.readFile(path).then(
        function(content) {
            return parseContent.apply(null, _.union(args, [content]));
        }
    );
};

/**
 * Parse content of file
 * @param arguments - {Array} - array with elements:
 * [0] - {Object} target object,
 * [1] - {String} name of one of documentation directories of repository
 * [2] - {String} name of doc directory (name of article)
 * [3] - {String} path to the doc file
 * [4] - {String} file name
 * [5] - {String} content of file
 * @returns {defer.promise|*}
 */
var parseContent = function() {
    var docName = arguments[2],
        fileName = arguments[4],
        content = arguments[5],
        extension = util.getFileExtension(fileName),
        language = util.getFileLanguage(fileName),
        def = Q.defer();

    try{
        var parser = {
            'wiki': parseWiki,
            'md': parseMarkdown,
            'meta.json': parseJson
        }[extension];

        content = parser ? parser.call(null, content) : content;

        def.resolve({
            name: docName,
            language: language,
            extension: extension,
            content: content
        });
    }catch(error) {
        def.reject(error);
    }finally {
        return def.promise;
    }
};

/**
 * Returns parsed wiki files
 * @param content - {String} string content of file
 * @returns {String} compiled html from wiki
 */
var parseWiki = function(content) {
    return SHMAKOWIKI.shmakowikiToHtml(content);
};

/**
 * Returns parsed markdown
 * @param content - {String} string content of file
 * @returns {String} compiled html from markdown
 */
var parseMarkdown = function(content) {
    var languages = {};

    return MARKED(content, {
        gfm: true,
        pedantic: false,
        sanitize: false,
        highlight: function(code, lang) {
            if (!lang) {
                return code;
            }
            var res = HIGHLIGHT.highlight(function(alias) {
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

/**
 * Returns parsed JSON content
 * @param content - {String} string content of file
 * @returns {Object}
 */
var parseJson = function(content) {
    return JSON.parse(content);
};

/**
 *
 * @param data
 */
var collectResults = function(data) {
    var en = [],
        ru = [];

    try {
        data = planerizeResults(data);

        data.filter(function(item) {
                return item.extension === 'meta.json';
            }).forEach(function(item) {
                var type = null,
                    category = null,
                    meta = item.content;

                //find and set linked content
                meta.content = findContentForMeta(data, item);

                //parse date from dd-mm-yyyy format into milliseconds
                if(meta.createDate) {
                    meta.createDate = util.formatDate(meta.createDate);
                }

                //parse date from dd-mm-yyyy format into milliseconds
                if(meta.editDate) {
                    meta.editDate = util.formatDate(meta.editDate);
                }

                if(_.isArray(meta.type)) {
                    type = meta.type[0];
                }

                category = (meta.categories && meta.categories.length > 0) ? meta.categories[0] : null;

                if(category) {
                    category = category.url || category;
                }

                //set canonical url for item
                meta.url =
                    [type, category, item.name].reduce(function(prev, item) {
                        return prev + (item ? ('/' + item) : '');
                    }, '') + '/';

                //generate unique id for source
                meta.id = SHA(JSON.stringify(meta));

                item.meta = meta;

                if(item.language === 'en') {
                    en.push(meta);
                }

                if(item.language === 'ru') {
                    ru.push(meta);
                }
            });
    }catch(err) {
        LOGGER.error(err.message);
    }

    return [
        {lang: 'en', data: en},
        {lang: 'ru', data: ru}
    ];
};

/**
 * Returns plane content from tree of promises
 * @param data {Object} tree of promises
 * @returns {Array}
 */
var planerizeResults = function(data) {
    var plane = [];
    data
        .filter(function(docs) {
            return docs.state === 'fulfilled';
        })
        .map(function(docs) {
            return docs.value
                .filter(function(doc) {
                    return doc.state === 'fulfilled';
                })
                .map(function(doc) {
                    return doc.value
                        .filter(function(file) {
                            return file.state === 'fulfilled';
                        })
                        .map(function(file) {
                            return plane.push(file.value);
                        });
                });
        });
    return plane;
};

/**
 * Returns content of linked markdown or wiki files
 * @param data - {Array} plane array of items
 * @param meta - {Object} item of meta file which we should find content for
 * @returns {String} html string content parsed from md ow wiki files
 */
var findContentForMeta = function(data, meta) {
    var result = data.filter(function(item) {
        return  item.name === meta.name &&
                item.language === meta.language &&
                (item.extension === 'md' || item.extension === 'wiki');
    });

    return result.length > 0 ? result[0].content : null;
};

module.exports = execute;
