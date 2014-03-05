/* global toString: false */
'use strict';

var util = require('util'),
    path = require('path'),

    q = require('q'),

    config = require('../config'),
    constants = require('../constants'),
    libs = require('../libs'),
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
                return libs.api
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
                libs.util.createDirectory(constants.DIRECTORY.CONTENT),
                libs.util.createDirectory(constants.DIRECTORY.OUTPUT)
            ])
            .then(function() {
                if(!libs.util.isDirectory(path.resolve(constants.DIRECTORY.OUTPUT, '.git'))) {
                    return libs.commands.gitInit()
                        .then(getUrlOfRemoteDataRepository)
                        .then(function(remoteUrl) {
                            return libs.commands.gitRemoteAdd('origin', remoteUrl);
                        });
                }

            });
    }
};
