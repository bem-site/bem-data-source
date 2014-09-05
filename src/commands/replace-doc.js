'use strict';

var path = require('path'),
    util = require('util'),

    vow = require('vow'),
    vowFs = require('vow-fs'),

    config = require('../config'),
    logger = require('../logger'),
    common = require('./common'),
    constants = require('../constants'),
    commander = require('../commander');

function replaceDoc(repo, version, doc, url) {
    var repoDir = path.join(constants.DIRECTORY.OUTPUT, repo),
        versionDir = path.join(repoDir, version),
        dataPath = path.join(versionDir, 'data.json');

    vowFs.exists(repoDir)
        .then(function(exists) {
           if(!exists) {
               return vow.reject('Directory %s does not exists', repoDir);
           }
           return vowFs.exists(versionDir);
        })
        .then(function(exists) {
            if(!exists) {
                return vow.reject('Directory %s does not exists', versionDir);
            }
            return vow.all([
                vowFs.exists(dataPath),
                vowFs.isFile(dataPath)
            ]);
        })
        .spread(function(exists, isFile) {
            if(!exists) {
                return vow.reject('File %s does not exists', dataPath);
            }
            if(!isFile) {
                return vow.reject('File %s is not file', dataPath);
            }
            return vowFs.read(dataPath, 'utf-8');
        })
        .then(function(content) {
            try {
                content = JSON.parse(content);
            }catch(err) {
                return vow.reject('File %s can not be parsed', dataPath);
            }

            if(!content.docs || !content.docs[doc]) {
                return vow.reject('Doc with key %s does not exists', doc);
            }
        });
}

module.exports = function() {

    return this
        .title('replace doc command')
        .helpful()
        .opt()
            .name('repo').title('Name of repository')
            .short('r').long('repo')
            .req()
            .end()
        .opt()
            .name('version').title('Version of repository (tag or branch)')
            .short('v').long('version')
            .req()
            .end()
        .opt()
            .name('doc').title('Document key: readme|changelog|migration|notes')
            .short('d').long('doc')
            .req()
            .end()
        .opt()
            .name('url').title('Github url of file with replacement content')
            .short('u').long('url')
            .req()
            .end()
        .act(function(opts) {
            logger.info(''.toUpperCase.apply('Try to replace documentation for:'));

            logger.info('repository name: %s', opts.repo);
            logger.info('repository version %s', opts.version);
            logger.info('documentation key %s', opts.doc);
            logger.info('replacement documentation url %s', opts.url);

            return replaceDoc(opts.repo, opts.version, opts.doc, opts.url).then(common({
                commitMessage: util.format('Replace doc %s for version %s of lib %s', opts.doc, opts.version, opts.repo),
                successMessage: 'REPLACE DOC COMMAND HAS BEEN FINISHED SUCCESSFULLY',
                errorMessage: 'REPLACE DOC COMMAND FAILED WITH ERROR %s'
            }));
        });
};

