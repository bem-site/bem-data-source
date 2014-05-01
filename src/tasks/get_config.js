/* global toString: false */
'use strict';

//application modules
var config = require('../config'),
    libs = require('../libs'),
    logger = libs.logger(module);

module.exports = {

    /**
     * Retrieves sources from local configuration file)
     * and modify it for suitable github API calling
     * @returns {defer.promise|*}
     */
    run: function() {
        logger.info('-- get configs start --');

        var isPrivate = config.get('private') && config.get('private') === 'true',
            user = config.get('user'),
            repo = config.get('repository'),
            tags = config.get('tags'),
            branches = config.get('branches');

        logger.info('Try to build sets for:');
        logger.info('repository privacy: %s', isPrivate);
        logger.info('repository user or organization: %s', user);
        logger.info('repository name: %s', repo);
        logger.info('repository refs %s', tags || branches);

        var err = false;

        if(!user) {
            err = true;
            logger.error('User or organization has not been set');
        }

        if(!repo) {
            err = true;
            logger.error('Repository name has not been set');
        }

        if(!tags && !branches) {
            err = true;
            logger.error('Tags or branches have not been set');
        }

        if(!err) {
            return {
                isPrivate: isPrivate,
                user: user,
                name: repo,
                tags: tags,
                branch: branches
            };
        }
    }
};