'use strict';

var path = require('path'),
    util = require('util'),

    vow = require('vow'),
    vowFs = require('vow-fs'),

    config = require('../config'),
    logger = require('../logger'),
    TargetPublish = require('../target-publish');

function readPackageJson() {
    return vowFs.read(path.join(process.cwd(), 'package.json'), 'utf-8')
        .then(function (content) {
            try {
                return vow.resolve(JSON.parse(content));
            }catch (err) {
                return vow.reject('Can not parse package.json file');
            }
        });
}

function _publish(version, options, isDryRun) {
    return readPackageJson().then(function (packageJson) {
            version = version || packageJson.version;
            version = version.replace(/\//g, '-');

            var repository = packageJson.repository,
                target = new TargetPublish({
                    name: packageJson.name,
                    url: repository && repository.url,
                    isPrivate: true
                }, version);
                target.setOptions(options);
                target.setDryRun(isDryRun);
            return target.execute();
        })
        .then(function () {
            logger.info('PUBLISH COMMAND HAS BEEN FINISHED SUCCESSFULLY', module);
        })
        .fail(function (err) {
            logger.error(util.format('PUBLISH COMMAND FAILED WITH ERROR %s', err.message), module);
        });
}

module.exports = {

    publish: function (version, options, isDryRun) {
        return _publish(version, options, isDryRun);
    },

    cmd: function () {
        return this
            .title('publish command')
            .helpful()
            .opt()
                .name('version').title('Version of repository (tag or branch)')
                .short('v').long('version')
                .end()
            .opt()
                .name('dry').title('Dry run mode of launch')
                .short('d').long('dry')
                .flag()
                .end()
            .act(function (opts) {
                logger.info('PUBLISH:', module);
                logger.info(util.format('repository version %s', opts.version), module);
                return _publish(opts.version, config.get('server'), opts.dry);
            });
    }
};
