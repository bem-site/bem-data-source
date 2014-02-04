/* global toString: false */
'use strict';

var util = require('util'),
    path = require('path'),

    q = require('q'),
    q_io = require('q-io/fs'),

    config = require('../config'),
    constants = require('../constants'),
    logger = require('../libs/logger')(module),
    api = require('../libs/api'),
    util = require('../libs/util'),

    commands = require('./cmd');

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
                            logger.error("Data repository was not found. Application will be terminated");
                        }
                    );
            };

        return q.all([
                util.createDirectory(constants.DIRECTORY.CONTENT),
                util.createDirectory(constants.DIRECTORY.OUTPUT)
            ])
            .then(function() {
                q_io
                    .isDirectory(path.resolve(constants.DIRECTORY.CONTENT, '.git'))
                    .then(function(isDir) {
                        if(!isDir) {
                            return commands.gitInit(constants.DIRECTORY.CONTENT)
                                .then(getUrlOfRemoteDataRepository)
                                .then(function(remoteUrl) {
                                    return commands.gitRemoteAdd(constants.DIRECTORY.CONTENT, 'origin', remoteUrl);
                                });
                        }
                    });
            });
    }
};
