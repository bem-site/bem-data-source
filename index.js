'use strict';

var util = require('util'),
    path =require('path'),
    cp = require('child_process'),

    _ = require('lodash'),
    nconf = require('nconf'),
    vow = require('vow'),
    vowFs = require('vow-fs'),
    fs = require('fs-extra'),
    md = require('marked'),
    Api = require('github'),
    intel = require('intel'),

    //application modules
    pattern = require('./config/pattern'),
    titles = require('./config/titles'),
    constants = require('./config/constants'),

    /**
     * Application configuration module based on nconf library
     */
    config = (function() {
        nconf
            .env()
            .file({ file: path.join('config', 'config.json') });

        nconf.add('credentials', {
            type: 'file',
            file: path.join('config', 'credentials.json')
        });

        return nconf;
    })(),

    /**
     * Application logger module based on intel library
     */
    logger = (function(_module) {
        intel.setLevel(config.get('logLevel'));
        intel.addHandler(
            new intel.handlers.Console({
                level: intel.VERBOSE,
                formatter: new intel.Formatter({
                    format: '[%(date)s] %(levelname)s %(name)s: %(message)s',
                    colorize: true
                })
            })
        );

        return intel.getLogger(_module ? _module.filename.split('/').slice(-2).join('/') : '');
    })(module),

    /**
     * Custom renderer for marked parser
     */
    renderer = (function() {
        var renderer = new md.Renderer();

        /**
         * Fix marked issue with cyrillic symbols replacing
         * @param text - {String} test of header
         * @param level - {Number} index of header
         * @param raw
         * @param options - {Object} options
         * @returns {String} - result header string
         */
        renderer.heading = function(text, level, raw, options) {
            var specials = ['-','[',']','/','{','}','(',')','*','+','?','.','\\','^','$','|','s','\'','\"'];

            options = options || {};
            options.headerPrefix = options.headerPrefix || '';

            return util.format('<h%s id="%s%s">%s</h%s>\n', level, options.headerPrefix,
                raw.replace(new RegExp('[' + specials.join('\\') + ']', 'g'), '-'), text, level);
        };

        return function get() {
            return renderer;
        };
    })(),

    /**
     * Github API module based on github library
     */
    api = (function() {

        logger.info('Initialize github API');

        var gitPublic,
            gitPrivate,
            commonConfig = {
                version: '3.0.0',
                debug: false,
                protocol: 'https',
                timeout: 50000
            },
            publicConfig = {
                host: 'api.github.com'
            },
            privateConfig = {
                host: 'github.yandex-team.ru',
                url: '/api/v3'
            },
            publicCredentials = config.get('credentials:public'),
            privateCredentials = config.get('credentials:private');

        if(!publicCredentials) {
            throw new Error('public credentials are not settled');
        }else {
            gitPublic = new Api(_.extend(publicConfig, commonConfig));
            gitPublic.authenticate({
                type: 'oauth',
                token: publicCredentials
            });
        }

        if(!privateCredentials) {
            throw new Error('private credentials are not settled');
        }else {
            gitPrivate = new Api(_.extend(privateConfig, commonConfig));
            gitPrivate.authenticate({
                type: 'oauth',
                token: privateCredentials
            });
        }

        return {
            /**
             * Return information about github repository
             * @param source - {Object} configuration object with fields:
             * - user {String} owner of repository
             * - name {String} name of repository
             * @returns {defer.promise|*}
             */
            getRepository: function(source) {
                var def = vow.defer(),
                    git = (source.isPrivate && source.isPrivate === 'true')  ? gitPrivate : gitPublic;

                git.repos.get({ user: source.user, repo: source.name }, function(err, res) {
                    if (err) {
                        logger.error(err.message);
                        def.reject(err);
                    }
                    def.resolve({ source: source, result: res });
                });

                return def.promise();
            },

            /**
             * Returns information about tags of github repository
             * @param source - {Object} configuration object with fields:
             * - user {String} owner of repository
             * - name {String} name of repository
             * @returns {defer.promise|*}
             */
            getRepositoryTags: function(source) {
                var def = vow.defer(),
                    git = source.isPrivate ? gitPrivate : gitPublic;

                git.repos.getTags({ user: source.user, repo: source.name, per_page: 100 }, function(err, res) {
                    if (err) {
                        logger.error(err.message);
                        def.reject(err);
                    }
                    def.resolve({ source: source, result: res });
                });

                return def.promise();
            },

            /**
             * Return information about branches of github repository
             * @param source - {Object} configuration object with fields:
             * - user {String} owner of repository
             * - name {String} name of repository
             * @returns {defer.promise|*}
             */
            getRepositoryBranches: function(source) {
                var def = vow.defer(),
                    git = source.isPrivate ? gitPrivate : gitPublic;

                git.repos.getBranches({ user: source.user, repo: source.name, per_page: 100 }, function(err, res) {
                    if (err) {
                        logger.error(err.message);
                        def.reject(err);
                    }
                    def.resolve({ source: source, result: res });
                });

                return def.promise();
            },

            /**
             * Returns content of repository directory or file loaded by github api
             * @param source - {Object} with fields:
             * - user {String} name of user or organization which this repository is belong to
             * - repo {String} name of repository
             * - ref {String} name of branch
             * - path {String} relative path from the root of repository
             * @returns {*}
             */
            getContent: function(source) {
                var def = vow.defer(),
                    git = source.isPrivate ? gitPrivate : gitPublic;
                git.repos.getContent({
                    user: source.user,
                    repo: source.repo,
                    ref:  source.ref,
                    path: source.path
                }, function(err, res) {
                    if (err || !res) {
                        def.reject({ res: null, repo: source });
                    }else {
                        def.resolve({ res: res, repo: source });
                    }
                });
                return def.promise();
            }
        };
    })(),

    /**
     * Returns interface for command execution
     * @returns {{gitAdd: gitAdd, gitCommit: gitCommit, gitPush: gitPush, runCommand: runCommand}}
     */
    getCmd = function() {
        return {
            /**
             * Adds all files for commit
             * @returns {defer.promise|*}
             */
            gitAdd: function() {
                return this.runCommand('git add .',
                    { cwd: path.resolve(constants.DIRECTORY.OUTPUT) }, 'git add', null);
            },

            /**
             * Executes git commit command
             * @param message - {String} commit message
             * @returns {defer.promise|*}
             */
            gitCommit: function(message) {
                return this.runCommand(util.format('git commit -a --allow-empty -m "%s"', message),
                    { cwd: path.resolve(constants.DIRECTORY.OUTPUT) }, 'git commit', null);
            },

            /**
             * Executes git push command
             * @param ref {String} of remote branch
             * @returns {defer.promise|*}
             */
            gitPush: function(ref) {
                return this.runCommand(util.format('git push -u origin %s', ref),
                    { cwd: path.resolve(constants.DIRECTORY.OUTPUT) }, 'git push', null);
            },

            /**
             * Run command in child process
             * @param cmd - {String} command to run
             * @param opts - {Object} options for command execution
             * @param name - {String} command name for log
             * @param target - {Object} target
             * @returns {defer.promise|*}
             */
            runCommand: function(cmd, opts, name, target) {
                var baseOpts = {
                    encoding: 'utf8',
                    maxBuffer: 1000000 * 1024
                };

                if (!target) {
                    target = {
                        getName: function() {
                            return 'all';
                        }
                    };
                }

                //logger.debug('execute %s for target %s', cmd, target.getName());
                logger.debug('execute command: %s', cmd);

                return getUtil().exec(cmd, _.extend(opts, baseOpts))
                    .then(function() {
                        logger.info('%s for target %s completed', name, target.getName());
                        return vow.resolve(target);
                    })
                    .fail(function(error) {
                        logger.error(error);
                        logger.error('execution of command: %s failed', cmd);
                        return vow.reject(error);
                    });
            }
        };
    },

    /**
     * Returns interface for uril methods
     * @returns {{exec: exec, mdToHtml: mdToHtml, removeDir: removeDir, getSSHUrl: getSSHUrl}}
     */
    getUtil = function() {
        return {
            /**
             * Executes specified command with options.
             * @param {String} cmd  Command to execute.
             * @param {Object} options  Options to `child_process.exec()` function.
             * @return {Promise}
             */
            exec: function(cmd, options) {
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
            },

            /**
             * Converts markdown content into html with marked module
             * @param content - {String} markdown content
             * @returns {String} - html string
             */
            mdToHtml: function(content) {
                return md(content, {
                    gfm: true,
                    pedantic: false,
                    sanitize: false,
                    renderer: renderer.get()
                });
            },

            /**
             * Removes directory with all files and subdirectories
             * @param path - {String} path to directory on filesystem
             * @returns {*}
             */
            removeDir: function(path) {
                var def = vow.defer();
                fs.remove(path, function(err) {
                    if(err) {
                        def.reject(err);
                    }

                    def.resolve();
                });

                return def.promise();
            },

            /**
             * Retrieve github ssh url via github api
             * @param repo - {Object} repo object
             * @returns {*}
             */
            getSSHUrl: function(repo) {
                return api
                    .getRepository({
                        user: repo.user,
                        name: repo.repo,
                        isPrivate: repo.private
                    })
                    .then(function(res) {
                        return res.result.ssh_url;
                    })
                    .fail(function() {
                        logger.error('Data repository was not found. Application will be terminated');
                    });
            }
        };
    },

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

    /**
     *
     * @returns {*}
     */
    getMdTargets: function() {
        return _.extend(this.def.docs, pattern[this.getSourceName()].docs || {});
    },

    /**
     *
     * @returns {*}
     */
    getBlockTargets: function() {
        return pattern[this.getSourceName()].pattern || this.def.pattern;
    },

    /**
     *
     * @returns {String}
     */
    getBuildCommand: function() {
        return pattern[this.getSourceName()].command || this.def.command;
    },

    /**
     * Returns array of masks for folder names that shoud be copied
     * from content to output directory
     * @returns {Array}
     */
    getCopyPatterns: function() {
        return pattern[this.getSourceName()].copy || this.def.copy;
    },

    /**
     *
     * @returns {*}
     */
    getDocPatterns: function() {
        return this.getCopyPatterns()[0];
    },

    /**
     * Returns name of builder
     * @returns {String}
     */
    getBuilderName: function() {
        return pattern[this.getSourceName()].builder || this.def.builder;
    },

    /**
     *
     * @returns {*|exports}
     */
    getTitles: function() {
        return titles;
    },

    /**
     * Returns array of tasks that should be executed for target
     * in the same order as they were written
     * @returns {Array}
     */
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
        var _this = this,
            initial = this.tasks.shift();
        return this.tasks.reduce(function(prev, item) {
            return prev.then(function() {
                return item.apply(_this);
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
        return getUtil().removeDir(this.getOutputPath()).then(function() { return this; });
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
        return getCmd().runCommand(
            util.format('git clone --progress %s %s', this.getUrl(), this.getContentPath()), {}, 'git clone', this);
    },

    /**
     * Executes git checkout command
     * @returns {defer.promise|*}
     */
    gitCheckout: function() {
        return getCmd().runCommand(util.format('git checkout %s', this.ref),
            { cwd: path.resolve(this.getContentPath()) }, 'git checkout', this);
    },

    /**
     * Cleans npm cache
     * @returns {defer.promise|*}
     */
    npmCacheClean: function() {
        return getCmd().runCommand('npm cache clean',
            { cwd: path.resolve(this.getContentPath()) }, 'npm cache clean', this);
    },

    /**
     * Executes npm install command
     * @returns {defer.promise|*}
     */
    npmInstall: function() {
        return getCmd().runCommand(util.format('npm install --registry="%s"',
                this.getSourcePrivacy() ? constants.NPM_REGISTRY.PRIVATE : constants.NPM_REGISTRY.PUBLIC),
            { cwd: path.resolve(this.getContentPath()) }, 'npm install', this);
    },

    /**
     * Updates bem sets version
     * @returns {defer.promise|*}
     */
    npmInstallBemSets: function() {
        return getCmd().runCommand(util.format('npm install --registry=%s bem-sets@x bem@0.x',
                this.getSourcePrivacy() ? constants.NPM_REGISTRY.PRIVATE : constants.NPM_REGISTRY.PUBLIC),
            { cwd: path.resolve(this.getContentPath()) }, 'npm install bem-sets', this);
    },

    /**
     * Updates bem tools version
     * @returns {defer.promise|*}
     */
    npmInstallBem: function() {
        return getCmd().runCommand(util.format('npm install --registry=%s bem@~0.8', constants.NPM_REGISTRY.PUBLIC),
            { cwd: path.resolve(this.getContentPath()) }, 'npm install bem', this);
    },

    /**
     * Executes npm run deps command
     * @returns {defer.promise|*}
     */
    npmRunDeps: function() {
        return getCmd().runCommand('npm run deps',
            { cwd: path.resolve(this.getContentPath()) }, 'npm run deps', this);
    },

    /**
     * Copy borschik file to library directory
     * @returns {defer.promise|*}
     */
    copyBorschik: function() {
        logger.debug('copy borschik configuration');
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
        return getCmd().runCommand(command, { cwd: path.resolve(this.getContentPath()) }, command, this);
    },

    /**
     * Executes copying sets folders
     * @returns {defer.promise|*}
     */
    copySets: function() {
        return vow.all(this.getCopyPatterns().map(function(item) {
            return getCmd().runCommand(util.format('cp -R %s %s', item, path.resolve(this.getOutputPath())),
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
                                result[key].content[lang] = getUtil().mdToHtml(content);
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

            return api.getContent(repo)
                .then(function(data) {
                    if(data.res) {
                        try {
                            result[key].content = result[key].content || {};
                            result[key][lang] = getUtil().mdToHtml((new Buffer(data.res.content, 'base64')).toString());
                        } catch(err) {}
                    }
                });
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

/**
 * At first creates content repository
 * Check if output directory is already exists
 * If yes return
 * Else clone remote github destination repository content in this output folder
 * @returns {*}
 */
function init() {
    return vowFs.makeDir(constants.DIRECTORY.CONTENT).then(function() {
        return vowFs.exists(constants.DIRECTORY.OUTPUT).then(function(exists) {
            if(exists) {
                return;
            }
            return getUtil().getSSHUrl(config.get('dataConfig'))
                .then(function(url) {
                    logger.info('Start clone remote target data repository. Please wait ...');
                    return Target.prototype.gitClone().apply({
                        getName: function() { return 'all'; },
                        getUrl: function() { return url; },
                        getContentPath: function() { return constants.DIRECTORY.OUTPUT; }
                    });
                })
                .then(function() {
                    logger.info('Remote target data repository has been cloned successfully');
                });
        });
    });
}

/**
 * Generates ssh url of repository
 * @param source - {Object} object with fields:
 * - isPrivate {Boolean} indicate if repository from private github
 * - name - {String} name of repository
 * - user {String} name of user or organization
 * - tag - {String} name of tag
 * - branch - {String} name of branch
 * @returns {defer.promise|*}
 */
function retrieveSshUrl(source) {
    var url = util.format('git://%s/%s/%s.git',
        source.isPrivate ? constants.GITHUB.PRIVATE : constants.GITHUB.PUBLIC, source.user, source.name);

    logger.debug('get repository with name %s and url %s', source.name, url);

    source.url = url;
    return source;
}

/**
 * Retrieves information about repository branches and filter them according to config
 * @param source - {Object} with fields:
 * - isPrivate {Boolean} indicate if repository from private github
 * - user {String} name of user or organization
 * - name - {String} name of repository
 * - tags - {String} tag name
 * - branches - {String} branch name
 * - url - {String} git url of repository
 * @param conf - {Object} with fields:
 * - field - {String} name of reference
 * - apiFunction - {Function} api function to retrieve reference information
 * @returns {defer.promise|*}
 */
function verifyRepositoryReferences(source, conf) {
    if(!source[conf.field]) {
        source[conf.field] = [];
        return source;
    }

    return conf.apiFunction.call(null, source)
        .then(function(res) {
            var refNames = res.result.map(function(item) {
                return item.name;
            });

            source[conf.field] = source[conf.field].filter(function(item) {
                var exists = refNames.indexOf(item) > -1;

                if(!exists) {
                    logger.warn('Ref %s does not actually present in repository %s', item, source.name);
                }

                return exists;
            });

            return source;
        });
}

/**
 * Create targets for source
 * @param source - {Object} with fields:
 * - isPrivate {Boolean} indicate if repository from private github
 * - user {String} name of user or organization
 * - name - {String} name of repository
 * - tags - {Array} array of tag names
 * - branches - {Array} array branch names
 * - url - {String} git url of repository
 * @returns {Array}
 */
function createTargets(source) {
    var targets = [];

    ['tags', 'branches'].forEach(function(type) {
        source[type].forEach(function(ref) {
            var target = new Target(source, ref, type);
            targets.push(target);

            logger.debug('create target %s into directory %s', target.getName(), target.getContentPath());
        });
    });

    if(!targets.length) {
        return vow.reject('no targets will be executed');
    }

    return targets;
}

function make(source) {
    try {
        init()
            .then(function() {
                return vowFs.listDir(constants.DIRECTORY.CONTENT).then(function(dirs) {
                    return vow.all(dirs.map(function(dir) {
                        var p = path.join(constants.DIRECTORY.CONTENT, dir);

                        logger.debug('remove directory %s', p);
                        return getUtil().removeDir(p);
                    }));
                });
            })
            .then(function() {
                return retrieveSshUrl(source);
            })
            .then(function(source) {
                return verifyRepositoryReferences(source, {
                    field: 'tags',
                    apiFunction: api.getRepositoryTags
                });
            })
            .then(function(source) {
                return verifyRepositoryReferences(source, {
                    field: 'branches',
                    apiFunction: api.getRepositoryBranches
                });
            })
            .then(createTargets)
            .then(function(targets) {
                return vow.all(targets.map(function(target) {
                    return target.execute();
                }));
            })
            .then(function() {
                return getCmd().gitAdd();
            })
            .then(function() {
                return getCmd().gitCommit(util.format('Update data: %s', (new Date()).toString()));
            })
            .then(function() {
                return getCmd().gitPush(config.get('dataConfig:ref'));
            })
            .then(function() {
                logger.info(''.toUpperCase.apply('application has been finished'));
            })
            .fail(function(err) {
                logger.error(err);
                logger.error(''.toUpperCase.apply('application failed with error'));
            });
    }catch(err) {
        logger.error(err.message);
    }
}

function command() {
    return require('coa').Cmd()
        .name(process.argv[1])
        .title('Library data builder')
        .helpful()
        .opt()
            .name('version').title('Show version')
            .short('v').long('version')
            .flag()
            .only()
            .act(function() {
                var p = require('./package.json');
                logger.info('application name: %s version %s', p.name, p.version);
                return '';
            })
            .end()
        .opt()
            .name('private').title('Privacy of repository')
            .short('p').long('private')
            .flag()
            .end()
        .opt()
            .name('user').title('User or organization for repository')
            .short('u').long('user')
            .req()
            .end()
        .opt()
            .name('repo').title('Name of repository')
            .short('r').long('repo')
            .req()
            .end()
        .opt()
            .name('tags').title('Name(s) of tags')
            .short('t').long('tags')
            .arr()
            .end()
        .opt()
            .name('branches').title('Name(s) of branches')
            .short('b').long('branches')
            .arr()
            .end()
        .opt()
            .name('docsOnly').title('Indicates that only docs should be collected')
            .short('docs-only').long('docs-only')
            .flag()
            .end()
        .act(function(opts) {
            logger.info(''.toUpperCase.apply('Try to build sets for:'));

            logger.info('repository privacy: %s', !!opts.private);
            logger.info('repository user or organization: %s', opts.user);
            logger.info('repository name: %s', opts.repo);
            logger.info('repository refs %s', opts.tags || opts.branches);
            logger.info('only docs %s', !!opts.docsOnly);

            if (!opts.tags && !opts.branches) {
                logger.error('Tags or branches have not been set');
                return;
            }

            make({
                isPrivate: !!opts.private,
                user: opts.user,
                name: opts.repo,
                tags: opts.tags || [],
                branches: opts.branches || [],
                docsOnly: !!opts.docsOnly
            });
        });
}

module.exports = command().run();
