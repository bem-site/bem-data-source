'use strict';

var util = require('util'),

    sha = require('sha1'),
    vow = require('vow'),

    inherit = require('inherit'),
    Api = require('../gh-api'),
    config = require('../config'),
    titles = require('../titles'),
    utility = require('../util'),
    constants = require('../constants'),
    storage = require('../storage'),
    Logger = require('../logger');

module.exports = inherit({

    _logger: undefined,
    _source: undefined,
    _ref: undefined,
    _options: undefined,

    /**
     * Initialize target object
     * @param {String} source - name of source (library)
     * @param {String} ref - name of reference (tag, branch, pr)
     * @param {Object} options - advanced options
     */
    __constructor: function (source, ref, options) {
        this._logger = new Logger(module, 'debug');

        this._source = source;
        this._ref = ref && ref.replace(/\//g, '-');
        this._options = options;
    },

    /**
     * Returns key for data.json file in storage
     * @param {String} source - name of source (library)
     * @param {String} ref - name of reference (tag, branch, pr)
     * @returns {String}
     * @private
     */
    _getDataKey: function (source, ref) {
        return util.format('%s/%s/%s', source, ref, constants.FILE.DATA);
    },

    /**
     * Executes target
     * @returns {*}
     */
    execute: function () {
        this._logger.info('Start to replace documentation file');

        var dataKey = this._getDataKey(this._source, this._ref),
            errorMsg;
        return storage.get(this._options.storage).readP(dataKey)
            .then(function (content) {
                if (!content) {
                    errorMsg = util.format('File %s does not exists in storage', dataKey);
                }

                try {
                    content = JSON.parse(content);
                } catch (err) {
                    errorMsg = util.format('File %s can not be parsed', dataKey);
                }

                if (errorMsg) {
                    this._logger.error(errorMsg);
                    throw new Error(errorMsg);
                }

                if (!content.docs) {
                    this._logger.warn('Docs section does not exists. It will be created');
                    content.docs = {};
                }

                // create doc of given key if it does not exists yet
                if (!content.docs[this._options.doc]) {
                    content = this._createDoc(content);
                }
                return vow.all([this._loadContentFromGh(), content]);
            }, this)
            .spread(function (data, content) {
                return this._replaceDoc(data, content);
            }, this)
            .then(function (content) {
                return this._writeFile(dataKey, content);
            }, this)
            .then(function (shaSum) {
                return this._updateRegistry(shaSum);
            }, this);
    },

    _loadContentFromGh: function () {
        var def = vow.defer(),
            gh = new Api({}),
            o = utility.parseGhUrl(this._options.url);
        gh.get(o).getContent(o, null, function (err, res) {
            err ? def.reject(err) : def.resolve(res);
        });
        return def.promise();
    },

    /**
     * Creates doc if it not exist yet
     * @param {Object} content - parsed content of data.json file
     * @returns {Object} content with added new document
     * @private
     */
    _createDoc: function (content) {
        this._logger.warn('Doc with key %s does not exists. It will be created', this._options.doc);
        var languages = config.get('languages'),
            _this = this,
            _title = languages.reduce(function (prev, item) {
                prev[item] = titles[_this._options.doc][item];
                return prev;
            }, {}),
            _content = languages.reduce(function (prev, item) {
                prev[item] = null;
                return prev;
            }, {});

        content.docs[this._options.doc] = {
            title: _title,
            content: _content
        };
        return content;
    },

    _replaceDoc: function (ghResponse, content) {
        if (!ghResponse) {
            throw new Error('Response can not retrieve data from github');
        }

        var _doc = content.docs[this._options.doc],
            replace = utility.mdToHtml((new Buffer(ghResponse.content, 'base64')).toString());

        // if lang option was not set then we should replace doc for all languages
        Object.keys(_doc.content)
            .filter((function (item) {
                return this._options.lang ? item === this._options.lang : true;
            }).bind(this))
            .forEach(function (item) {
                _doc.content[item] = replace;
            });

        content.docs[this._options.doc] = _doc;
        return content;
    },

    /**
     * Writes modified data.json file to storage
     * @param {String} dataKey key of data.json file in storage
     * @param {String} content of modified data.json file
     * @returns {*}
     * @private
     */
    _writeFile: function (dataKey, content) {
        var strContent = JSON.stringify(content);
        return storage.get(this._options.storage).writeP(dataKey, strContent)
            .then(function () {
                return sha(strContent);
            });
    },

    /**
     * Updates data in registry
     * @param {String} shaSum - sha sum of updated content object
     * @returns {*}
     * @private
     */
    _updateRegistry: function (shaSum) {
        return storage.get(this._options.storage).readP(constants.ROOT)
            .then(function (registry) {
                registry = registry ? JSON.parse(registry) : {};
                registry[this._source] = registry[this._source] || { name: this._source, versions: {} };
                registry[this._source].versions[this._ref] = {
                    sha: shaSum,
                    date: +(new Date())
                };
                return storage.get(this._options.storage).writeP(constants.ROOT, JSON.stringify(registry));
            }, this);
    }
});
