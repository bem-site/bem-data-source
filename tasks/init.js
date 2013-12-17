/* global toString: false */
'use strict';

//bem tools modules
var BEM = require('bem'),
    Q = BEM.require('q'),
    U = BEM.require('./util'),
    PATH = BEM.require('./path'),
    LOGGER = BEM.require('./logger'),

    //application modules
    config = require('../config/config'),
    git = require('../libs/git'),
    util = require('../libs/util'),

    commands = require('./cmd');

var execute = function() {
    var contentDir = config.get('contentDirectory'),
        outputDir = config.get('outputDirectory');

    return Q.all([
            util.createDirectory(contentDir),
            util.createDirectory(outputDir)
        ]).then(function() {
            if(!U.isDirectory(PATH.resolve(contentDir, '.git'))) {
                return commands.gitInit(contentDir)
                    .then(function() {
                        var dataRepository = config.get("dataRepository");

                        return git.getRepository({
                                user: dataRepository.user,
                                name: dataRepository.name,
                                isPrivate: false
                            })
                            .then(function(res) {
                                return res.result.ssh_url;
                            });
                    })
                    .then(function(remoteUrl) {
                        return commands.gitRemoteAdd(contentDir, 'origin', remoteUrl);
                    });
            }
        });
};

module.exports = execute;
