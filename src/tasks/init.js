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
    INFO: {
        CLONE_DATA_REPO_START: 'Start clone remote target data repository. Please wait ...',
        CLONE_DATA_REPO_END: 'Remote target data repository has been cloned successfully'
    },
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

        return libs.util.createDirectory(constants.DIRECTORY.CONTENT)
            .then(function() {
                if(!libs.util.isDirectory(constants.DIRECTORY.OUTPUT)) {

                    logger.info(MSG.INFO.CLONE_DATA_REPO_START);
                    return getUrlOfRemoteDataRepository()
                        .then(function(remoteUrl) {
                            return libs.cmd.gitClone({
                                url: remoteUrl,
                                contentPath: constants.DIRECTORY.OUTPUT
                            });
                        })
                        .then(function() {
                            logger.info(MSG.INFO.CLONE_DATA_REPO_END);
                        });
                }
            });
    }
};
