var UTIL = require('util'),

    BEM = require('bem'),
    Q = BEM.require('q'),
    PATH = BEM.require('./path'),
    LOGGER = BEM.require('./logger'),
    U = BEM.require('./util'),
    _ = BEM.require('underscore'),

    //application modules
    util = require('../libs/util');

var execute = function(target) {
    LOGGER.silly(UTIL.format('make docs start for target %s', target.name));

    var def = Q.defer(),
        docDirs = target.docDirs;

    if(!docDirs) {
        def.reject(new Error(UTIL.format('docDir property for target %s undefined', target.name)));
    }else if(!_.isArray(docDirs)) {
        def.reject(new Error(UTIL.format('docDir property for target %s must be array', target.name)));
    } else {
        if(docDirs.length == 0) {
            docDirs = [''];
        }

        Q.all(docDirs.map(function(dir) {
            return readDocsDirectory(target, dir);
        }))
        .then(
            function(result) {
                def.resolve(result);
            },
            function(err) {
                def.reject(err);
            }
        );
    }
    return def.promise;
};

var readDocsDirectory = function(target, dir) {
    LOGGER.silly(
        UTIL.format('make docs: read docs directory %s for target %s',
            dir.length > 0 ? dir : 'root', target.name));

    return U.getDirsAsync(PATH.join(target.path, dir))
        .then(function(directories) {
            return Q.all(directories
                    .filter(util.filterDocDirectory)
                    .map(function(dirName) {
                        return readDocDirectory(target, dirName, PATH.join(target.path, dir, dirName));
                    })
            );
        });
};

var readDocDirectory = function(target, docName, path) {
    LOGGER.silly(UTIL.format('make docs: read doc directory %s for target %s', docName, target.name));
    return U.getFilesAsync(path)
        .then(function(files) {
            return Q.all(files
                    .filter(function(fileName) {
                        return util.filterDocFile(fileName, docName);
                    })
                    .map(function(fileName) {
                        return readDocFile(target, docName, PATH.join(path, fileName), fileName);
                    })
            );
        });
};

var readDocFile  = function(target, docName, path, fileName) {
    LOGGER.silly(UTIL.format('make docs: read file %s for target %s', fileName, target.name));
}

module.exports = execute;
