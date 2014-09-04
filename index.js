'use strict';

var logger = require('./src/logger');

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
            .act(function() {
                var p = require('./package.json');
                logger.info('application name: %s version %s', p.name, p.version);
                return '';
            })
            .end()
        .cmd().name('make').apply(require('./src/commands/make')).end()
        .cmd().name('replace-doc').apply(require('./src/commands/replace-doc')).end()
        .cmd().name('remove').apply(require('./src/commands/remove')).end()
        .completable();
}

module.exports = command().run();
