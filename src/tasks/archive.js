'use strict';

var util = require('util'),
    path = require('path'),
    zlib = require('zlib'),

    fstream = require('fstream'),
    tar = require('tar'),
    vow = require('vow'),
    vowFs = require('vow-fs'),

    commander = require('../commander'),
    constants = require('../constants');

module.exports = function (target) {
    var TEMP_DIR = '__temp';

    var copyDataFile = function() {
        return vowFs.copy(
            path.join(target.getOutputPath(), constants.FILE.DATA),
            path.join(path.join(target.getOutputPath(), TEMP_DIR), constants.FILE.DATA)
        );
    };

    return vowFs.makeDir(path.join(target.getOutputPath(), TEMP_DIR))
        .then(function() {
            return vow.all([copyDataFile()].concat(target.getCopyPatterns()
                .filter(function(item) {
                    return item !== target.getDocPatterns();
                }).map(function(item) {
                    return commander.runCommand(
                        util.format('cp -R %s %s', item, path.resolve(target.getOutputPath(), TEMP_DIR)),
                    { cwd: path.resolve(target.getContentPath()) }, util.format('copy folders %s', item), null);
                })
            ));
        })
        .then(function() {
            var archiveName = util.format('%s__%s.gz', target.getSourceName(), target.ref)
            fstream.Reader({ path: path.join(target.getOutputPath(), TEMP_DIR), 'type': 'Directory' })
                .pipe(tar.Pack())
                .pipe(zlib.Gzip())
                .pipe(fstream.Writer({ path: path.join(target.getOutputPath(), archiveName) }));

            return target;
        });
};
