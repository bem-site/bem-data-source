'use strict';

var util = require('util'),
    logger = require('./logger');

function command() {
    return require('coa').Cmd()
        .name(process.argv[1])
            .title('Library data builder')
            .helpful()
        .opt()
            .name('version').title('Show version')
            .short('v').long('version')
            .flag()
            .only()
            .act(function () {
                var p = require('../package.json');
                logger.info(util.format('application name: %s version %s', p.name, p.version), module);
                return '';
            })
            .end()
        .cmd().name('publish').apply(require('./commands/publish').cmd).end()
        .cmd().name('replace-doc').apply(require('./commands/replace-doc').cmd).end()
        .cmd().name('remove').apply(require('./commands/remove').cmd).end()
        .completable();
}

module.exports = command();
