/* global toString: false */
'use strict';

var util = require('util'),
    path = require('path'),

    q = require('q'),
    q_io = require('q-io/fs'),
    _ = require('lodash'),

    //application modules
    config = require('../config'),
    libs = require('../libs'),
    logger = libs.logger(module);

var MSG = {
    ERR: {
        CONF_NOT_FOUND: 'Configuration file was not found on local filesystem',
        PRIVATE_NOT_SET: 'Private flag has not been set',
        USER_NOT_SET: 'User or organization has not been set',
        REPO_NOT_SET: 'Repository name has not been set',
        TAG_OR_BRANCH_NOT_SET: 'Tag and Branch named have not been set'
    },
    INFO: {
        START: '-- get configs start --',
        END: '-- get configs end --'
    }
};

module.exports = {

    /**
     * Retrieves sources from local configuration file)
     * and modify it for suitable github API calling
     * @returns {defer.promise|*}
     */
    run: function() {
        logger.info(MSG.INFO.START);

        return q_io.read(path.resolve('config', 'repositories') + '.json')
            .then(
                function(content) {
                    return createSources(JSON.parse(content));
                },
                function() {
                    logger.error(MSG.ERR.CONF_NOT_FOUND);
                }
            )
            .then(
                function(sources) {
                    logger.info(MSG.INFO.END);
                    return sources;
                }
            );
    }
};

/**
 * Make plane source structure with field additions:
 * - isPrivate - {Boolean} flag which indicates privacy level of repository
 * - user - {String} user or organization
 * @param sources - object from configuration json files
 * @returns {Array} - array with sources for processing on next steps
 */
var createSources = function(sources) {

    //build of single library version by params
    var priv = !!config.get('private'),
        user = config.get('user'),
        repo = config.get('repository'),
        tag = config.get('tag'),
        branch = config.get('branch');

    var result = [];


    _.keys(sources).forEach(function(key) {
        sources[key].forEach(function(source) {
            var owner = source.org || source.user,
                repositories = source.repositories;

            if(owner && repositories) {
                repositories.forEach(function(repository) {
                    result.push(_.extend(repository, {
                        user: owner,
                        isPrivate: key === 'private'
                    }));
                });
            }
        });
    });

    if(priv || user || repo || tag || branch) {
        logger.info('Params for special library version were set');
        logger.info('Params private: %s user: %s repo: %s tag: %s branch: %s', priv, user, repo, tag, branch);

        var err = false;

        if(!priv) {
            err = true;
            logger.error(MSG.ERR.PRIVATE_NOT_SET);
        }

        if(!user) {
            err = true;
            logger.error(MSG.ERR.USER_NOT_SET);
        }

        if(!repo) {
            err = true;
            logger.error(MSG.REPO_NOT_SET);
        }

        if(!tag && !branch) {
            err = true;
            logger.error(MSG.TAG_OR_BRANCH_NOT_SET);
        }

        var exist = result.filter(function(item) {
            return priv === item.isPrivate && user === item.user && repo === item.name;
        })[0];

        if(!err && exist) {
            if(tag) {
                if(exist.tags.include.indexOf(tag) === -1) {
                    exist.tags.include.push(tag);
                }
                exist.tags.exclude = _.without(exist.tags.exclude, tag);
            }

            if(branch) {
                if(exist.branches.include.indexOf(branch) === -1) {
                    exist.branches.include.push(branch);
                }
                exist.branches.exclude = _.without(exist.branches.exclude, branch);
            }
        }
    }

    return result;
};
