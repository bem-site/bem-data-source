'use strict';

var path = require('path'),
    util = require('util'),

    vow = require('vow'),
    vowFs = require('vow-fs'),

    api = require('../gh-api'),
    config = require('../config'),
    logger = require('../logger'),
    pusher = require('../pusher'),
    utility = require('../util'),
    titles = require('../titles'),
    constants = require('../constants');

/**
 * This method needs for check if file data.json
 * really exists in dir output/{repo}/{version} folder
 * @param {String} repo (lib)
 * @param {String} version of library (branch ot tag)
 * @returns {*}
 */
function _checkForFileExist(repo, version) {
    var repoDir = path.join(constants.DIRECTORY.OUTPUT, repo),
        versionDir = path.join(repoDir, version),
        dataPath = path.join(versionDir, 'data.json');

    return vowFs.exists(repoDir)
        .then(function (exists) {
            if (!exists) {
                return vow.reject('Directory %s does not exists', repoDir);
            }
            return vowFs.exists(versionDir);
        })
        .then(function (exists) {
            if (!exists) {
                return vow.reject('Directory %s does not exists', versionDir);
            }
            return vow.all([
                vowFs.exists(dataPath),
                vowFs.isFile(dataPath)
            ]);
        })
        .spread(function (exists, isFile) {
            if (!exists) {
                return vow.reject('File %s does not exists', dataPath);
            }
            if (!isFile) {
                return vow.reject('File %s is not file', dataPath);
            }
            return vowFs.read(dataPath, 'utf-8');
        });
}

function _replaceDoc(repo, version, doc, lang, url, needToCommit) {
    logger.info('TRY TO REPLACE DOCUMENTATION FOR:', module);

    logger.debug(util.format('repository name: %s', repo), module);
    logger.debug(util.format('repository version %s', version), module);
    logger.debug(util.format('documentation key %s', doc), module);
    logger.debug(util.format('documentation language %s', lang || 'all'), module);
    logger.debug(util.format('replacement documentation url %s', url), module);

    return _checkForFileExist(repo, version).then(function (content) {
        try {
            content = JSON.parse(content);
        }catch (err) {
            return vow.reject('Target library version file can not be parsed');
        }

        if (!content.docs) {
            logger.warn('Docs section does not exists. It will be created', module);
            content.docs = {};
        }

        if (!content.docs[doc]) {
            logger.warn(util.format('Doc with key %s does not exists. It will be created', doc), module);
            var languages = config.get('languages'),
                _title = languages.reduce(function (prev, item) {
                    prev[item] = titles[doc][item];
                    return prev;
                }, {}),
                _content = languages.reduce(function (prev, item) {
                    prev[item] = null;
                    return prev;
                }, {});

            content.docs[doc] = {
                title: _title,
                content: _content
            };
        }

        // parse web url to gh doc for retrieve all necessary information about repository
        var _url = url.match(/^https?:\/\/(.+?)\/(.+?)\/(.+?)\/(tree|blob)\/(.+?)\/(.+)/);

        if (!_url) {
            return vow.reject('Invalid format of url %s', url);
        }

        return api.getContent({
                isPrivate: _url[1].indexOf('yandex') > -1,
                user: _url[2],
                repo: _url[3],
                ref:  _url[5],
                path: _url[6]
            })
            .then(function (data) {
                if (!data.res) {
                    return vow.reject('Response by url %s is empty', _url);
                }
                var _doc = content.docs[doc],
                    replace = utility.mdToHtml((new Buffer(data.res.content, 'base64')).toString());

                // if lang option was not set then we should replace doc for all languages
                Object.keys(_doc.content)
                    .filter(function (item) {
                        return lang ? item === lang : true;
                    }).forEach(function (item) {
                        _doc.content[item] = replace;
                    });

                content.docs[doc] = _doc;
                return content;
            }).then(function (content) {
                var repoDir = path.join(constants.DIRECTORY.OUTPUT, repo),
                    versionDir = path.join(repoDir, version),
                    dataPath = path.join(versionDir, 'data.json');
                return vowFs.write(dataPath, JSON.stringify(content, null, 4), { charset: 'utf8' });
            }).then(function () {
                if (needToCommit) {
                    return pusher.commitAndPush({
                        commitMessage: util.format('Replace doc %s for version %s of lib %s',
                            doc, version, repo),
                        successMessage: 'REPLACE DOC COMMAND HAS BEEN FINISHED SUCCESSFULLY',
                        errorMessage: 'REPLACE DOC COMMAND FAILED WITH ERROR %s'
                    })();
                } else {
                    return vow.resolve();
                }
            });
    });
}

module.exports = {
    replaceDoc: function (repo, version, doc, lang, url) {
        return _replaceDoc(repo, version, doc, lang, url, false);
    },

    cmd: function () {
        return this
            .title('replace doc command')
            .helpful()
            .opt()
                .name('repo').title('Name of repository')
                .short('r').long('repo')
                .req()
                .end()
            .opt()
                .name('version').title('Version of repository (tag or branch)')
                .short('v').long('version')
                .req()
                .end()
            .opt()
                .name('doc').title('Document key: readme|changelog|migration|notes')
                .short('d').long('doc')
                .req()
                .end()
            .opt()
                .name('lang').title('Document language: ru|en|...')
                .short('l').long('lang')
            .end()
                .opt()
                .name('url').title('Github url of file with replacement content')
                .short('u').long('url')
                .req()
            .end()
            .act(function (opts) {
                return _replaceDoc(opts.repo, opts.version, opts.doc, opts.lang, opts.url, true);
            });
    }
};
