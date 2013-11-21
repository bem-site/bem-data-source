var BEM = require('bem'),
    FS = require('fs'),
    CP = require('child_process'),
    Q = BEM.require('q'),
    fs = BEM.require('q-io/fs'),
    PATH = BEM.require('./path'),
    LOGGER = BEM.require('./logger'),
    U = BEM.require('./util'),

    config = require('./config/config'),
    util = require('./libs/util');

var make = function() {
    LOGGER.info('- data source start -');
    util.createContentDirectory()
    .then(function() {

    })
};



make();