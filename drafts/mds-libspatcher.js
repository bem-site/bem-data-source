/**
 * Tools for patching bem libraries files in MDS
 *
 * GET: Get file for editing, after get file, module put a file from MDS in the same dir
 * cmd: node mds-libspatcher.js -a [action] -l [lib name] -v [lib version] -f [full path to file in MDS]
 * Example: node mds-libspatcher.js -a get -l bem-components -v v2.0.0
 * -f desktop.examples/image/5xLdnqyxW_oRsW_zluHfor4aioo/5xLdnqyxW_oRsW_zluHfor4aioo.html
 *
 * PUT: Put edited file in MDS
 * cmd: node mds-libspatcher.js -a [action] -l [lib name] -v [lib version] -f [full path to file in MDS] -e [edited file]
 * Example: node mds-libspatcher.js -a put -l bem-components -v v2.0.0
 * -f desktop.examples/image/5xLdnqyxW_oRsW_zluHfor4aioo/5xLdnqyxW_oRsW_zluHfor4aioo.html
 * -e bem-components-v2.0.0-desktop.examples-image-5xLdnqyxW_oRsW_zluHfor4aioo-5xLdnqyxW_oRsW_zluHfor4aioo.html
 *
 * data.json: this file is in root of library
 * Example: node mds-libspatcher.js -a get -l bem-components -v v2.0.0 -f data.json
 */

'use strict';

var fs = require('fs'),
    path = require('path'),
    util = require('util'),

    MDS = require('mds-wrapper'),
    mds = new MDS({
        namespace: 'bem-info',
        get: {
            host: 'storage.mdst.yandex.net'
        },
        post: {
            host: 'storage-int.mdst.yandex.net'
        },
        auth: 'Basic ' + process.env['BASIC_AUTH_TOKEN'],
        timeout: 300000,
        debug: true
    }),
    sha = require('sha1');

function Patcher(){}

Patcher.prototype.init = function() {
    var _this = this;

    require('coa').Cmd().name(process.argv[1])
        .title('Tool for patching libs files in MDS')
        .helpful()
        .opt()
            .name('action').title('Action type [get/put]')
            .short('a').long('action')
            .def('get')
            .val(function (v) {
                if (['get', 'put'].indexOf(v) === -1) {
                    this.reject(util.format('%s is not available action', v));
                }
                return v;
            })
            .req()
            .end()
        .opt()
            .name('lib').title('lib name, for example: bem-components')
            .req()
            .short('l').long('lib')
            .end()
        .opt()
            .name('version').title('lib version, for example: v2.0.0')
            .req()
            .short('v').long('version')
            .end()
        .opt()
            .name('file').title('Full file`s path, for example:\n  data.json: data.json\n  examples: desktop.examples/button/aEHGWBM4GAouQ-f_UP0AXw-M7SU/aEHGWBM4GAouQ-f_UP0AXw-M7SU.html\n')
            .req()
            .short('f').long('file')
            .end()
        .opt()
            .name('edited-file')
            .short('e').long('edited-file')
            .end()
        .act(function (opts) {
            _this[opts.action](opts);
        })
        .run();
};

Patcher.prototype.get = function(opts) {
    var key = path.join(opts.lib, opts.version, opts.file),
        file = key.split('/').join('-');

    mds.read(key, function(err, data) {
        if(err) throw err;

        fs.writeFile(file, data, function (err) {
            if (err) throw err;

            console.log('\nFile download and saved!');
        });
    });
};

Patcher.prototype.put = function(opts) {
    var _this = this,
        lib = opts.lib,
        version = opts.version,
        editedFile = opts['edited-file'],
        key;

    fs.readFile(editedFile, { encoding: 'utf-8' }, function(err, data) {
        if (err) throw err;

        key = path.join(lib, version, opts.file);

        //data = JSON.parse(data)
        // { sha: '75677bea1c8eefcf09e93ca4911f5bfe50ce2ee4', date: 1423135990241 }
        //console.log('data', data['bem-components'].versions['v2.0.0']);
        // +(new Date())

        mds.write(key, data.toString(), function(err) {
            if(err) throw err;

            _this.updateRegistry(lib, version, sha(editedFile));
        });
    });
};

Patcher.prototype.updateRegistry = function(lib, version, shaSum) {
    mds.read('root', function(err, data) {
        if(err) throw err;

        data = JSON.parse(data);

        // console.log('passed lib', lib);
        // console.log('passed version', version);
        // console.log('root data', data['bem-components'].versions['v2.0.0']);

        data[lib].versions[version] = {
            sha: shaSum,
            date: +(new Date())
        };

        //console.log('edited root data', data['bem-components'].versions['v2.0.0']);

        data = JSON.stringify(data);

        mds.write('root', data.toString(), function (err) {
            if (err) throw err;

            console.log('\nRegistry updated!');
        });
    });
};

Patcher.prototype.getRoot = function() {
    mds.read('root', function(err, data) {
        if(err) throw err;

        data = JSON.parse(data);
        console.log('data root', data);
    });
};

// Init
new Patcher().init();
