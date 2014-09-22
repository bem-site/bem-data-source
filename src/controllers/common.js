'use strict';

var util = require('util'),
    path = require('path'),

    vow = require('vow'),
    vowFs = require('vow-fs'),

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
        .then(function() {
            return result.sort(function(a, b) {
                return a.name > b.name;
            });
        });
};

exports.getVersions = function (req) {
    var result = [],
        lib = req.params.lib,
        version = req.params.version,
        p = path.join(process.cwd(), constants.DIRECTORY.OUTPUT);

    if (!lib) {
        return [];
    }
    p = path.join(p, lib);

    return vowFs.listDir(p).then(function (versions) {
            return vow.all(versions.map(function (item) {
                return vowFs.isDir(path.join(p, item)).then(function (isDir) {
                    return isDir ?
                        result.push({
                            name: item,
                            url: util.format('/libs/%s/%s', lib, item),
                            checked: item === version
                        }) : vow.resolve();
                });
            }));
        })
        .then(function() {
            return result.sort();
        });
};
