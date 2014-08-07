'use strict';

var util = require('util'),
    path = require('path'),

    _ = require('lodash'),
    vow = require('vow'),
    vowFs = require('vow-fs'),

    libs = require('./libs'),
    config = require('./config'),
    constants = require('./constants'),
    pattern = require('../config/pattern'),
    titles = require('../config/titles'),
    logger = require('./libs/logger')(module),
    u = libs.util,

    Target = function(source, ref, type) {
        return this.init(source, ref, type);
    };

Target.prototype = {

    def: {
        builder: 'bem-tools',
        command: 'npm run build',
        copy: ['*.sets'],
        docs: {
            readme: { folder: '', pattern: 'README.md' },
            changelog: { folder: 'releases', pattern: 'changelog.md' },
            migration: { folder: 'releases', pattern: 'migration.md' },
            notes: { folder: 'releases', pattern: 'release-notes.md' }
        },
        pattern: {
            data: '%s.data.json',
            jsdoc: '%s.jsdoc.json'
        },
        tasks: constants.TASKS,
        custom: []
    },
    source: null,
    ref: null,
    type: null,
    tasks: [],

    /**
     * Initialize target for build
     * @param source - {Object} source
     * @param ref - {String} name of tag or branch
     * @param type - {String} type of reference
     * @returns {Target}
     */
    init: function(source, ref, type) {
        this.source = source;
        this.ref = ref;
        this.type = type;

        pattern[this.getSourceName()] = pattern[this.getSourceName()] || this.def;

        this.tasks = this.getTasks().map(function(item) {
            return this[item];
        }, this);

        return this;
    },

    /**
     * Returns human readable name for target
     * @returns {String}
     */
    getName: function() {
        return util.format('%s %s', this.source.name, this.ref);
    },

    /**
     * Returns name of library
     * @returns {String}
     */
    getSourceName: function() {
        return this.source.name;
    },

    /**
     * Returns source privacy flag
     * @returns {boolean}
     */
    getSourcePrivacy: function() {
        return this.source.isPrivate;
    },

    /**
     * Return gh url for library
     * @returns {String}
     */
    getUrl: function() {
        return this.source.url;
    },

    getMdTargets: function() {
        return _.extend(this.def.docs, pattern[this.getSourceName()].docs || {});
    },

    getBlockTargets: function() {
        return pattern[this.getSourceName()].pattern || this.def.pattern;
    },

    getBuildCommand: function() {
        return pattern[this.getSourceName()].command || this.def.command;
    },

    getCopyPatterns: function() {
        return pattern[this.getSourceName()].copy || this.def.copy;
    },

    getDocPatterns: function() {
        return this.getCopyPatterns()[0];
    },

    getBuilderName: function() {
        return pattern[this.getSourceName()].builder || this.def.builder;
    },

    getTitles: function() {
        return titles;
    },

    getTasks: function() {
        if(this.source.docsOnly) {
            return  [
                constants.TASKS.REMOVE_OUTPUT,
                constants.TASKS.CREATE_OUTPUT,
                constants.TASKS.GIT_CLONE,
                constants.TASKS.GIT_CHECKOUT,
                constants.TASKS.COLLECT_SETS
            ];
        }

        return pattern[this.getSourceName()].tasks || _.values(this.def.tasks);
    },

    /**
     * Returns path of library in output folder
     * @returns {String}
     */
    getContentPath: function() {
        return path.join(constants.DIRECTORY.CONTENT, this.source.name, this.ref.replace(/\//g, '-'));
    },

    /**
     * Returns path of library in output folder
     * @returns {String}
     */
    getOutputPath: function() {
        return path.join(constants.DIRECTORY.OUTPUT, this.source.name, this.ref.replace(/\//g, '-'));
    },

    /**
     * Make chained calls for all tasks for target and call them
     * @returns {*}
     */
    execute: function() {
        var self = this,
            initial = this.tasks.shift();
        return this.tasks.reduce(function(prev, item) {
            return prev.then(function() {
                return item.apply(self);
            });
        }, initial.apply(this));
    },

    /**
     *
     * @returns {{repo: *, ref: *, url: string}}
     */
    createSetsResultBase: function() {
        return {
            repo: this.source.name,
            ref: this.ref,
            enb: this.getBuilderName() === 'enb',
            url: this.source.url.replace('git:', 'http:').replace('.git', ''),
            custom: this.getCustom(),
            docs: {}
        };
    },

    /**
     * Add custom pseudo-nodes to library version
     * and set actual library name and version to url pattern
     * @returns {*}
     */
    getCustom: function() {
        return (pattern[this.getSourceName()].custom || this.def.custom).map(function(item) {
            if(item.url) {
                item.url = item.url
                    .replace('{lib}', this.getSourceName())
                    .replace('{ref}', this.ref);
            }
            return item;
        }, this);
    },


    /** ------------ commands ------------- **/

    /**
     * Remove target folder in output directory
     * @returns {defer.promise|*}
     */
    removeOutput: function() {
        logger.debug('remove output folder for target %s', this.getName());
        return u.removeDir(this.getOutputPath()).then(function() { return this; });
    },

    /**
     * Create target folder in output directory
     * @returns {defer.promise|*}
     */
    createOutput: function() {
        logger.debug('create output folder for target %s', this.getName());
        return vowFs.makeDir(this.getOutputPath()).then(function() { return this; });
    },

    /**
     * Executes git clone command
     * @returns {defer.promise|*}
     */
    gitClone: function() {
        return libs.cmd.runCommand(
            util.format('git clone --progress %s %s', this.getUrl(), this.getContentPath()), {}, 'git clone', this);
    },

    /**
     * Executes git checkout command
     * @returns {defer.promise|*}
     */
    gitCheckout: function() {
        return libs.cmd.runCommand(util.format('git checkout %s', this.ref),
            { cwd: path.resolve(this.getContentPath()) }, 'git checkout', this);
    },

    /**
     * Cleans npm cache
     * @returns {defer.promise|*}
     */
    npmCacheClean: function() {
        return libs.cmd.runCommand('npm cache clean',
            { cwd: path.resolve(this.getContentPath()) }, 'npm cache clean', this);
    },

    /**
     * Executes npm install command
     * @returns {defer.promise|*}
     */
    npmInstall: function() {
        return libs.cmd.runCommand(util.format('npm install --registry="%s"',
                this.getSourcePrivacy() ? constants.NPM_REGISTRY.PRIVATE : constants.NPM_REGISTRY.PUBLIC),
            { cwd: path.resolve(this.getContentPath()) }, 'npm install', this);
    },

    /**
     * Updates bem sets version
     * @returns {defer.promise|*}
     */
    npmInstallBemSets: function() {
        return libs.cmd.runCommand(util.format('npm install --registry=%s bem-sets@x bem@0.x',
                this.getSourcePrivacy() ? constants.NPM_REGISTRY.PRIVATE : constants.NPM_REGISTRY.PUBLIC),
            { cwd: path.resolve(this.getContentPath()) }, 'npm install bem-sets', this);
    },

    /**
     * Updates bem tools version
     * @returns {defer.promise|*}
     */
    npmInstallBem: function() {
        return libs.cmd.runCommand(util.format('npm install --registry=%s bem@~0.8', constants.NPM_REGISTRY.PUBLIC),
            { cwd: path.resolve(this.getContentPath()) }, 'npm install bem', this);
    },

    /**
     * Executes npm run deps command
     * @returns {defer.promise|*}
     */
    npmRunDeps: function() {
        return libs.cmd.runCommand('npm run deps',
            { cwd: path.resolve(this.getContentPath()) }, 'npm run deps', this);
    },

    /**
     * Copy borschik file to library directory
     * @returns {defer.promise|*}
     */
    copyBorschik: function() {
        logger.debug('copy borschik configuration for target %s', this.getName());
        return vowFs
            .copy('.borschik', path.join(this.getContentPath(), '.borschik'))
            .then(function() {
                return this;
            }
        );
    },

    /**
     * Executes npm run deps command
     * @returns {defer.promise|*}
     */
    npmRunBuild: function() {
        var command = this.getBuildCommand();
        return libs.cmd.runCommand(command, { cwd: path.resolve(this.getContentPath()) }, command, this);
    },

    /**
     * Executes copying sets folders
     * @returns {defer.promise|*}
     */
    copySets: function() {
        return vow.all(this.getCopyPatterns().map(function(item) {
            return libs.cmd.runCommand(util.format('cp -R %s %s', item, path.resolve(this.getOutputPath())),
                { cwd: path.resolve(this.getContentPath()) }, util.format('copy folders %s', item), this);
        }, this));
    },

    collectSets: function() {
        logger.info('-- collect sets start --');

        var result = this.createSetsResultBase();
        return this._readMDFilesForLibrary(result)
            .then(function() { return this._readDependencies(result); }, this)
            .then(function() { return this._readLevelsForLibrary(result); }, this)
            .then(function() { return this._writeResultToFile(result); }, this)
            .then(function() {
                logger.info('-- collect sets end --');
                return this;
            }, this);
    },

    /** ----- collect sets private methods ------- **/

    /**
     * Read markdown files for library and compile them into html
     * @param result - {Object} result model
     * @returns {*}
     */
    _readMDFilesForLibrary: function(result) {
        logger.debug('read markdown files for library %s', this.getName());
        return vow.allResolved(Object.keys(this.getMdTargets())
                .map(function(key) {
                    //TODO change this code!
                    var folder = this.getMdTargets()[key].folder,
                        fn = _.isUndefined(folder) ? this._loadMDFromRemote : this._loadMDFromFile;
                    return fn.call(this, result.docs, key);
                }, this)
        );
    },

    /**
     * Reads markdown files from filesystem
     * @param result - {Object} result model
     * @param key - {String} key with name of markdown doc
     * @returns {*}
     */
    _loadMDFromFile: function(result, key) {
        return vowFs
            .listDir(path.join(this.getContentPath(), this.getMdTargets()[key].folder))
            .then(function(files) {
                var languages = config.get('languages') || ['en'],
                    pattern = this.getMdTargets()[key].pattern;

                if(!_.isObject(pattern)) {
                    pattern = languages.reduce(function(prev, lang) {
                        prev[lang] = pattern;
                        return prev;
                    }, {});
                }

                result[key] = {
                    title: this.getTitles()[key],
                    content: null
                };

                return vow.allResolved(Object.keys(pattern).map(function(lang) {
                    var file  = files.filter(function(file) {
                        return file.indexOf(pattern[lang]) !== -1;
                    }).pop();

                    return vowFs
                        .read(path.join(this.getContentPath(), this.getMdTargets()[key].folder, file), 'utf-8')
                        .then(function(content) {
                            try {
                                result[key].content = result[key].content || {};
                                result[key].content[lang] = u.mdToHtml(content);
                            } catch(e) {}
                        });
                }, this));
            }, this);
    },

    /**
     * Reads markdown files from remote github repo via Github API
     * @param result - {Object} result model
     * @param key - {String} key with name of markdown doc
     * @returns {*}
     */
    _loadMDFromRemote: function(result, key) {
        var languages = config.get('languages') || ['en'],
            pattern = this.getMdTargets()[key].pattern;

        if(!_.isObject(pattern)) {
            pattern = languages.reduce(function(prev, lang) {
                prev[lang] = pattern;
                return prev;
            }, {});
        }

        result[key] = {
            title: this.getTitles()[key],
            content: null
        };

        return vow.allResolved(Object.keys(pattern).map(function(lang) {
            var repo = (function(s) {
                var ps = s.match(/^https?:\/\/(.+?)\/(.+?)\/(.+?)\/(tree|blob)\/(.+?)\/(.+)/);
                return {
                    isPrivate: ps[1].indexOf('yandex') > -1,
                    user: ps[2],
                    repo: ps[3],
                    ref:  ps[5],
                    path: ps[6]
                };
            })(pattern[lang]);

            return libs.api.getContent(repo)
                .then(function(data) {
                    if(data.res) {
                        try {
                            result[key].content = result[key].content || {};
                            result[key][lang] = u.mdToHtml((new Buffer(data.res.content, 'base64')).toString());
                        } catch(err) {}
                    }
                })
                .fail(function() {});
        }));
    },

    /**
     * Reads library dependencies from bower.json file
     * @param result - {Object} result model
     * @returns {*}
     */
    _readDependencies: function(result) {
        return vowFs.read(path.resolve(this.getContentPath(), 'bower.json'),'utf-8')
            .then(function(content) {
                try {
                    content = JSON.parse(content);
                    result.deps = content.dependencies;
                }catch(e) {
                    result.deps = null;
                }
            })
            .fail(function() {
                result.deps = null;
            });
    },

    /**
     * Scan level directories for library
     * @param result - {Object} result model
     * @returns {*}
     */
    _readLevelsForLibrary: function(result) {
        logger.debug('read level directories for library %s', this.getName());

        return vowFs.listDir(path.resolve(this.getOutputPath()))
            .then(function(levels) {
                var levelNames = ['desktop', 'touch-pad', 'touch-phone'].map(function(item) {
                    return item + this.getDocPatterns().replace('*', '');
                }, this);

                levels = levels.filter(function(item) {
                    return levelNames.indexOf(item) !== -1;
                });

                return vow.allResolved(levels.map(function(level) {
                    level = { name: level };
                    result.levels = result.levels || [];
                    result.levels.push(level);

                    return this._readBlocksForLevel(result, level);
                }, this));
            }, this);
    },

    /**
     * Scan block directories for level
     * @param result - {Object} result model
     * @param level - {Object} level
     * @returns {*}
     */
    _readBlocksForLevel: function(result, level) {
        var blockIgnores = ['.dist', '.bem', 'index', 'catalogue', 'index', 'jscatalogue'];

        return vowFs.listDir(path.resolve(this.getOutputPath(), level.name))
            .then(function(blocks) {
                return vow.allResolved(
                    blocks
                        .filter(function(block) {
                            return blockIgnores.indexOf(block) === -1;
                        })
                        .map(function(block) {
                            block = { name: block };
                            level.blocks = level.blocks || [];
                            level.blocks.push(block);

                            return this._readDataForBlock(result, level, block);
                        }, this)
                );
            }, this);
    },

    /**
     * Read data files for single block
     * @param result - {Object} result model
     * @param level - {Object} level
     * @param block - {Object} block
     * @returns {*}
     */
    _readDataForBlock: function(result, level, block) {
        return vow.allResolved(Object.keys(this.getBlockTargets()).map(function(key) {
                return vowFs.read(path.resolve(this.getOutputPath(),level.name, block.name,
                    util.format(this.getBlockTargets()[key], block.name)), 'utf-8')
                    .then(function(content) {
                        try {
                            block[key] = JSON.parse(content);
                        }catch(e) {
                            block[key] = content;
                        }
                    })
                    .fail(function() {
                        block[key] = null;
                    });
            }, this)
        );
    },

    /**
     * Save result model into json file
     * @param result - {Object} result model
     * @returns {*}
     */
    _writeResultToFile: function(result) {
        logger.debug('write result of target %s to file %s', this.getName(),
            path.resolve(this.getOutputPath(), constants.FILE.DATA));

        return vowFs.write(path.resolve(this.getOutputPath(), constants.FILE.DATA),
            JSON.stringify(result, null, 4), { charset: 'utf8' });
    }
};

module.exports = Target;
