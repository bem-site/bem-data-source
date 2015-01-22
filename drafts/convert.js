'use strict';
var path = require('path'),
    util = require('util'),

    vow = require('vow'),
    vowFs = require('vow-fs'),
    logger = require('../src/logger'),

    processExamples = require('../src/tasks/process-examples'),
    sendDocumentation = require('../src/tasks/send-doc'),

    options = {
        host: 'storage-int.mdst.yandex.net',
        namespace: 'lego-site',
        get: { port: 80 },
        post: { port: 1111 },
        auth: 'Basic bGVnby1zaXRlOjJkZGUyZjI0OGIxODI2NWRiZWM2ZGRiOGVhMjBkNjg0',
        timeout: 180000
    },

    CVT = function (lib, version, options) {
        this.source = lib;
        this.ref = version;
        this.options = options;
        this.getOutputPath = function () {
            return path.join(process.cwd(), version);
        };
        this.getTempPath = this.getOutputPath;
        this.getSourceName = function () {
            return lib;
        };
    };

function convertLibrary() {
    logger.info('START CONVERTING LIBRARY', module);
    var cwd = process.cwd(),
        libName = cwd.split('/').pop();
    logger.info(util.format('current directory: %s', cwd), module);
    logger.info(util.format('library name: %s', libName), module);

    return vowFs.listDir(process.cwd())
        .then(function (versions) {
            return versions.reduce(function (prev, version) {
                prev = prev.then(function () {
                    return convertLibraryVersion(libName, version);
                });
                return prev;
            }, vow.resolve());
        })
        .then(function () {
            logger.info('LIBRARY CONVERTED SUCCESSFULLY', module);
        })
        .fail(function (err) {
            logger.error('ERROR occur while converting library files', module);
            logger.error(err, module);
        });
}

function convertLibraryVersion(lib, version) {
    logger.info(util.format('Convert: library - [%s] version - [%s]', lib, version), module);
    var t = new CVT(lib, version, options);
    return processExamples(t).then(function () {
        return sendDocumentation(t);
    });
}

convertLibrary().done();
