var BEM = require('bem'),
    FS = require('fs'),
    CP = require('child_process'),
    Q = BEM.require('q'),
    PATH = BEM.require('./path'),
    LOGGER = BEM.require('./logger'),
    U = BEM.require('./util'),

    config = require('./config/config');

var make = function() {
    LOGGER.info('- data source start -');
};

make();