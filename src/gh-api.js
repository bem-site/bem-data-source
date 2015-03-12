'use strict';

var Api = require('github'),
    vow = require('vow'),
    _ = require('lodash'),

    config = require('./config'),

    gitPublic,
    gitPrivate;

/**
 * Github API module based on github library
 */
exports.init = function () {
    logger.info('Initialize github API', module);

        var commonConfig = {
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

    gitPublic = new Api(_.extend(publicConfig, commonConfig));
    if (publicCredentials && publicCredentials.length) {
        gitPublic.authenticate({ type: 'oauth', token: publicCredentials });
    }else {
        logger.warn('It would be better if you were input you public credential oauth token', module);
    }

    gitPrivate = new Api(_.extend(privateConfig, commonConfig));
    if (privateCredentials && privateCredentials.length) {
        gitPrivate.authenticate({ type: 'oauth', token: privateCredentials });
    }
};

/**
 * Returns content of repository directory or file loaded by github api
 * @param {Object} source configuration object with fields:
 * - user {String} name of user or organization which this repository is belong to
 * - repo {String} name of repository
 * - ref {String} name of branch
 * - path {String} relative path from the root of repository
 * @returns {*}
 */
exports.getContent = function (source) {
    var def = vow.defer(),
        git = source.isPrivate ? gitPrivate : gitPublic;
    git.repos.getContent(source, function (err, res) {
        def.resolve({ res: (err || !res) ? null : res, repo: source });
    });
    return def.promise();
};
