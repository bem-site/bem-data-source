'use strict';

var util = require('util'),
    _ = require('lodash'),

    config = require('../config'),
    Logger = require('../logger'),
    utility = require('../util'),
    TargetReplace = require('../targets/replace');

module.exports = function () {
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
            .val(function (v) {
                if (['readme', 'changelog', 'migration', 'notes'].indexOf(v) === -1) {
                    this.reject(util.format('%s is not available doc', v));
                }
                return v;
            })
            .req()
            .end()
        .opt()
            .name('lang').title('Document language: ru|en|...')
            .short('l').long('lang')
            .end()
        .opt()
            .name('url').title('Github url of file with replacement content')
            .short('u').long('url')
            .req()
            .end()
        .opt()
            .name('storage').title('Storage environment: (testing|production)')
            .short('s').long('storage')
            .def('testing')
            .val(function (v) {
                if (['testing', 'production'].indexOf(v) === -1) {
                    this.reject(util.format('%s is not available storage environment', v));
                }
                return v;
            })
            .end()
        .act(function (opts) {
            var logger = new Logger(module, 'info'),
                o = _.extend({
                        doc: opts.doc,
                        lang: opts.lang,
                        url: opts.url
                    },
                    {
                        storage: utility.getStorageConfiguration(config.get('storage'), opts['storage'])
                    }),
                target = new TargetReplace(opts.repo, opts.version, o);
            target.execute()
                .then(function () {
                    logger.info('REPLACE COMMAND HAS BEEN FINISHED SUCCESSFULLY');
                })
                .fail(function (err) {
                    logger.error('REPLACE COMMAND FAILED WITH ERROR %s', err.message);
                })
                .done();
        });
};
