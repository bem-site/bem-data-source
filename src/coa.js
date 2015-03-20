'use strict';

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
                console.info('Application name: %s version %s', p['name'], p.version);
                return void 0;
            })
            .end()
        .cmd().name('publish').apply(require('./commands/publish')).end()
        .cmd().name('replace').apply(require('./commands/replace')).end()
        .cmd().name('remove').apply(require('./commands/remove')).end()
        .cmd().name('migrate').apply(require('./commands/migrate')).end()
        .cmd().name('view').apply(require('./commands/view')).end()
        .completable();
}

module.exports = command();
