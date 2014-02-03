/* global toString: false */
'use strict';

var UTIL = require('util'),

    //bem tools modules
    BEM = require('bem'),
    Q = BEM.require('q'),
    U = BEM.require('./util'),
    PATH = BEM.require('./path'),
    LOGGER = BEM.require('./logger'),

    //application modules
    config = require('../../config/config'),
    git = require('../../libs/git'),
    util = require('../../libs/util'),

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
        var contentDir = config.get('contentDirectory'),
            outputDir = config.get('outputDirectory'),
            dataRepository = config.get("dataConfig"),
            getUrlOfRemoteDataRepository = function() {
                return git
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
                            LOGGER.error("Data repository was not found. Application will be terminated");
                        }
                    );
            };

        return Q.all([ util.createDirectory(contentDir), util.createDirectory(outputDir) ]).then(function() {
            if(!U.isDirectory(PATH.resolve(contentDir, '.git'))) {
                return commands.gitInit(contentDir)
                    .then(getUrlOfRemoteDataRepository)
                    .then(function(remoteUrl) {
                        return commands.gitRemoteAdd(contentDir, 'origin', remoteUrl);
                    });
            }
        });
    }
};
