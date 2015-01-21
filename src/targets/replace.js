'use strict';

var util = require('util'),

    sha = require('sha1'),
    vow = require('vow'),

    api = require('../gh-api'),
    config = require('../config'),
    logger = require('../logger'),
    titles = require('../titles'),
    utility = require('../util'),
    constants = require('../constants'),
    storage = require('../storage'),

    TargetReplace  = function (source, ref, options) {
        return this.init(source, ref, options);
    };

TargetReplace.prototype = {
    source: undefined,
    ref: undefined,
    options: undefined,

    /**
     * Initialize target object
     * @param {String} source - name of source (library)
     * @param {String} ref - name of reference (tag, branch, pr)
     * @param {Object} options - advanced options
     * @returns {TargetRemove}
     */
    init: function (source, ref, options) {
        this.source = source;
        this.ref = ref && ref.replace(/\//g, '-');
        this.options = options;
        return this;
    },

    /**
     * Executes target
     * @returns {*}
     */
    execute: function () {
        logger.info('Replace documentation file', module);
        api.init();

        var dataKey = util.format('%s/%s/%s', this.source, this.ref, constants.FILE.DATA);

        return storage.get(this.options).readP(dataKey)
            .then(function (content) {
                if (!content) {
                    return vow.reject(util.format('File %s does not exists in storage', dataKey));
                }

                try {
                    content = JSON.parse(content);
                } catch (err) {
                    return vow.reject(util.format('File %s can not be parsed', dataKey));
                }

                if (!content.docs) {
                    logger.warn('Docs section does not exists. It will be created', module);
                    content.docs = {};
                }

                if (!content.docs[this.options.doc]) {
                    content = this._createDoc(content);
                }

                return vow.all([api.getContent(this._getGithubApiConfigFromUrl()), content]);
            }, this)
            .spread(function (data, content) {
                if (!data.res) {
                    return vow.reject('Response can not retrieve data from github');
                }

                var _doc = content.docs[this.options.doc],
                    replace = utility.mdToHtml((new Buffer(data.res.content, 'base64')).toString());

                // if lang option was not set then we should replace doc for all languages
                Object.keys(_doc.content)
                    .filter((function (item) {
                        return this.options.lang ? item === this.options.lang : true;
                    }).bind(this))
                    .forEach(function (item) {
                        _doc.content[item] = replace;
                    });

                content.docs[this.options.doc] = _doc;
                return content;
            }, this)
            .then(function (content) {
                var strContent = JSON.stringify(content);
                return storage.get(this.options).writeP(dataKey, strContent)
                    .then(function () {
                        return sha(strContent);
                    });
            }, this)
            .then(function (shaSum) {
                return this._updateRegistry(shaSum);
            }, this);
    },

    /**
     * Creates doc if it not exist yet
     * @param {Object} content - parsed content of data.json file
     * @returns {Object} content with added new document
     * @private
     */
    _createDoc: function (content) {
        logger.warn(util.format('Doc with key %s does not exists. It will be created', this.options.doc), module);
        var languages = config.get('languages'),
            _this = this,
            _title = languages.reduce(function (prev, item) {
                prev[item] = titles[_this.options.doc][item];
                return prev;
            }, {}),
            _content = languages.reduce(function (prev, item) {
                prev[item] = null;
                return prev;
            }, {});

        content.docs[this.options.doc] = {
            title: _title,
            content: _content
        };
        return content;
    },

    /**
     * Parse given gh url of replacement file and returns config for github api call
     * @returns {{isPrivate: boolean, user: *, repo: *, ref: *, path: *}}
     * @private
     */
    _getGithubApiConfigFromUrl: function () {
        // parse web url to gh doc for retrieve all necessary information about repository
        var regexp = /^https?:\/\/(.+?)\/(.+?)\/(.+?)\/(tree|blob)\/(.+?)\/(.+)/,
            _url = this.options.url.match(regexp);

        if (!_url) {
            throw new Error(util.format('Invalid format of url %s', this.options.url));
        }

        return {
            isPrivate: _url[1].indexOf('yandex') > -1,
            user: _url[2],
            repo: _url[3],
            ref:  _url[5],
            path: _url[6]
        };
    },

    /**
     * Updates data in registry
     * @param {String} shaSum - sha sum of updated content object
     * @returns {*}
     * @private
     */
    _updateRegistry: function (shaSum) {
        return storage.get(this.options).readP(constants.ROOT)
            .then(function (registry) {
                registry = registry ? JSON.parse(registry) : {};
                registry[this.source] = registry[this.source] || { name: this.source, versions: {} };
                registry[this.source].versions[this.ref] = {
                    sha: shaSum,
                    date: +(new Date())
                };
                return storage.get(this.options).writeP(constants.ROOT, JSON.stringify(registry));
            }, this);
    }
};

module.exports = TargetReplace;
