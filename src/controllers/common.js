'use strict';

var util = require('util'),
    path = require('path'),

    _ = require('lodash'),
    vow = require('vow'),
    vowFs = require('vow-fs'),

    logger = require('../logger'),
    utility = require('../util'),
    constants = require('../constants');

exports.getLibraries = function (req) {
    var result = [],
        lib = req.params.lib,
        p = path.join(process.cwd(), constants.DIRECTORY.OUTPUT);

    return vowFs.listDir(p).then(function (libs) {
            return vow.all(libs.map(function (item) {
                return vowFs.isDir(path.join(p, item)).then(function (isDir) {
                    return (isDir && ['.git', 'freeze'].indexOf(item) === -1) ?
                        result.push({
                            name: item,
                            url: util.format('/libs/%s', item),
                            checked: item === lib
                        }) : vow.resolve();
                });
            }));
        })
        .then(function () {
            return result.sort(function (a, b) {
                return a.name > b.name;
            });
        });
};

exports.getVersions = function (req) {
    var result = [],
        lib = req.params.lib,
        p = path.join(process.cwd(), constants.DIRECTORY.OUTPUT);

    if (!lib) {
        return [];
    }
    p = path.join(p, lib);

    return vowFs.listDir(p).then(function (versions) {
            return vow.all(versions.sort(utility.sortLibraryVerions).map(function (item) {
                var versionPath = path.join(p, item);
                return vowFs.isDir(versionPath).then(function (isDir) {
                    if(!isDir) {
                        return vow.resolve();
                    }
                    return vowFs
                        .read(path.join(versionPath, 'data.json'))
                        .then(function(content) {
                            try {
                                content = JSON.parse(content);
                                result.push(_.omit(content, 'levels'));
                            } catch(e) {
                                logger.warn(util.format('Can not parse file %s',
                                    path.join(versionPath, 'data.json')), module);
                            }
                        });
                });
            }));
        })
        .then(function () {
            return result;
        });
};
