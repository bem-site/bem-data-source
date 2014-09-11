'use strict';

var path = require('path'),
    util = require('util'),

    vow = require('vow'),
    vowFs = require('vow-fs'),

    logger = require('../logger'),
    TargetPublish = require('../target-publish');

function readPackageJson() {
    return vowFs.read(path.join(process.cwd(), 'package.json'), 'utf-8')
        .then(function(content) {
            try {
                return vow.resolve(JSON.parse(content));
            }catch(err) {
                return vow.reject('Can not parse package.json file');
            }
        });
}

function publish(version) {
    return readPackageJson().then(function(packageJson) {
        var repository = packageJson.repository,
            target = new TargetPublish({
                name: packageJson.name,
                url: repository && repository.url,
                isPrivate: true
            }, version || packageJson.version);
        return target.execute();
    })
    .fail(function(err) {
        logger.error(err.message, module);
    });
}

module.exports = function () {
    return this
        .title('publish command')
        .helpful()
        .opt()
            .name('version').title('Version of repository (tag or branch)')
            .short('v').long('version')
        .end()
        .act(function (opts) {
            logger.info('PUBLISH:', module);
            logger.info(util.format('repository version %s', opts.version), module);
            return publish(opts.version);
        });
};
