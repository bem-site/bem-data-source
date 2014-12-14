'use strict';

var util = require('util'),

    vow = require('vow'),
    logger = require('../logger'),
    constants = require('../constants'),
    storage = require('../cocaine/api'),

    TargetView  = function (source, ref, options) {
        return this.init(source, ref, options);
    };

TargetView.prototype = {
    source: undefined,
    ref: undefined,
    options: undefined,

    /**
     * Initialize target object
     * @param {String} source - name of source (library)
     * @param {String} ref - name of reference (tag, branch, pr)
     * @param {Object} options - advanced options
     * @returns {TargetRemove}
     */
    init: function (source, ref, options) {
        this.source = source;
        this.ref = ref && ref.replace(/\//g, '-');
        this.options = options;
        return this;
    },

    /**
     * Executes target
     * @returns {*}
     */
    execute: function() {
        return storage.init()
            .then(function () {
                return storage.read(constants.ROOT);
            })
            .then(function(registry) {
                if (!registry) {
                    logger.warn('No registry record were found. ' +
                    'Please try to make publish any library. Also this operation will be skipped', module);
                    return vow.resolve();
                }

                registry = JSON.parse(registry);

                if (this.source && this.ref) {
                    if(this.options.format === 'short') {
                        if(!registry[this.source]) {
                            logger.warn(util.format('Library %s was not found in registry', this.ref), module);
                            return vow.resolve(null);
                        }

                        var version = registry[this.source ].versions[this.ref];
                        logger.info(util.format('Library: %s version: %s sha: %s date: %s',
                            this.source, this.ref, version.sha, version.date), module);
                        return vow.resolve(version);
                    }
                    //TODO implement show of data.json file for full format
                }

                if (this.source) {
                    if(!registry[this.source]) {
                        logger.warn(util.format('Library %s was not found in registry', this.ref), module);
                        return vow.resolve([]);
                    }

                    var lib = registry[this.source];
                    logger.info(util.format('Library: %s', lib.name), module);
                    logger.info('Versions:', module);

                    Object.keys(lib.versions).forEach(function(versionName) {
                        var version = lib.versions[versionName];
                        logger.debug(util.format('version: %s sha: %s date: %s',
                            versionName, version.sha, version.date), module);
                    });
                    return vow.resolve(Object.keys(lib.versions));
                }

                logger.info('Libraries:', module);
                Object.keys(registry).forEach(function(libraryName) {
                    logger.debug(util.format('library: %s', libraryName), module);
                });
                return vow.resolve(Object.keys(registry));
            }, this);
    }
};


module.exports = TargetView;


