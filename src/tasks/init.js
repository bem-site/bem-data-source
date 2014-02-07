/* global toString: false */
'use strict';

var util = require('util'),
    path = require('path'),

    q = require('q'),

    config = require('../config'),
    constants = require('../constants'),
    libs = require('../libs'),

    u = libs.util,
    api = libs.api,
    commands = libs.cmd,
    logger = libs.logger(module);

var MSG = {
    ERROR: {
        DATA_REPO_NOT_FOUND: 'Data repository was not found. Application will be terminated'
    }
};

module.exports = {

    /**
     * Creates content and output directories
     * If content directory doesn't link to remote git repository yet
     * then initialize git repository, retrieves ssh url of remote
     * github repository for build results and link local git repository
     * in content directory with remote github repo
     * @returns {*|then}
     */
    run: function() {
        var dataRepository = config.get("dataConfig"),
            getUrlOfRemoteDataRepository = function() {
                return api
                    .getRepository({
                        user: dataRepository.user,
                        name: dataRepository.repo,
                        isPrivate: dataRepository.private
                    })
                    .then(
                        function(res) {
                            return res.result.ssh_url;
                        },
                        function() {
                            logger.error(MSG.ERROR.DATA_REPO_NOT_FOUND);
                        }
                    );
            };

        return q.all([
                u.createDirectory(constants.DIRECTORY.CONTENT),
                u.createDirectory(constants.DIRECTORY.OUTPUT)
            ])
            .then(function() {
                if(!u.isDirectory(path.resolve(constants.DIRECTORY.OUTPUT, '.git'))) {
                    return commands.gitInit(constants.DIRECTORY.OUTPUT)
                        .then(getUrlOfRemoteDataRepository)
                        .then(function(remoteUrl) {
                            return commands.gitRemoteAdd(constants.DIRECTORY.OUTPUT, 'origin', remoteUrl);
                        })
                        .then(function() {
                            return commands.gitCheckout(constants.DIRECTORY.OUTPUT, dataRepository.ref);
                        });
                }

            });
    }
};
